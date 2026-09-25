#!/usr/bin/env bash
#
# Asserts that every pod this chart renders meets the Pod Security Standards
# `restricted` profile, the same bar as the backend chart (adapted from its
# infra/pdfthumbnailpro-be-chart/assert-security-context.sh). A pod that
# fails it is a failed deploy under restricted admission, not a warning.
#
# Usage: infra/pdfthumb-dashboard/assert-security-context.sh [chart-dir]
#
# Needs helm and yq v4 (mikefarah); both are preinstalled on ubuntu-latest.

# shellcheck disable=SC2016  # yq expressions, not shell expansion
set -euo pipefail

CHART_DIR="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"

RENDERED="$(mktemp)"
trap 'rm -f "$RENDERED"' EXIT

# The chart has one shape. It only renders in its own namespace (see
# _helpers.tpl), so take that from values.yaml.
NAMESPACE="$(yq eval '.namespace' "$CHART_DIR/values.yaml")"
helm template assert-security-context "$CHART_DIR" -n "$NAMESPACE" >"$RENDERED"

# Every container here runs nginx, so every one must hold a read-only root
# filesystem plus the writable mounts nginx needs: /var/cache/nginx for its
# temp files and /var/run for its pid.
WRITABLE_PATHS='/var/cache/nginx /var/run'

failures=0
fail() {
  echo "FAIL: $*" >&2
  failures=$((failures + 1))
}

# Reading happens in two passes on purpose. Selecting the document first and
# only then binding variables keeps yq from emitting a null for every document
# that did not match; binding across the whole multi-document stream in one
# pass yields a line per manifest instead of a single value.
#
# The value is printed raw, so a missing field reads as `null` and a field that
# is genuinely `false` is not mistaken for one - yq's `//` cannot be used here
# because it treats `false` as empty and would return the fallback.
#
# stdin is /dev/null on the first pass so this cannot swallow the caller's
# `while read` input.
read_field() {
  # read_field <kind> <name> <container> <expression over $pod and $c>
  yq eval "select(.kind == \"$1\" and .metadata.name == \"$2\")" "$RENDERED" </dev/null |
    yq eval "
      .spec.template.spec as \$pod
      | \$pod.containers[] | select(.name == \"$3\") as \$c
      | $4
    " -
}

# One "<kind>/<name>/<container>" line per container in every Deployment and
# Job, so a workload added later is covered without editing this script.
containers="$(
  yq eval 'select(.kind == "Deployment" or .kind == "Job")' "$RENDERED" |
    yq eval '
      .kind + "/" + .metadata.name as $workload
      | .spec.template.spec.containers[]
      | $workload + "/" + .name
    ' - |
    grep '/'
)"

if [ -z "$containers" ]; then
  echo "FAIL: the chart rendered no Deployment or Job containers" >&2
  exit 1
fi

while IFS='/' read -r kind name container; do
  [ -n "$container" ] || continue
  id="$kind/$name/$container"

  # runAsNonRoot may sit on the pod or on the container; either satisfies PSS.
  run_as_non_root="$(read_field "$kind" "$name" "$container" \
    '[$c.securityContext.runAsNonRoot, $pod.securityContext.runAsNonRoot] | map(select(. != null)) | .[0]')"
  [ "$run_as_non_root" = 'true' ] || fail "$id: runAsNonRoot is not true (got '$run_as_non_root')"

  ape="$(read_field "$kind" "$name" "$container" '$c.securityContext.allowPrivilegeEscalation')"
  [ "$ape" = 'false' ] || fail "$id: allowPrivilegeEscalation is not false (got '$ape')"

  dropped="$(read_field "$kind" "$name" "$container" \
    '[$c.securityContext.capabilities.drop] | flatten | map(select(. != null)) | join(",")')"
  [ "$dropped" = 'ALL' ] || fail "$id: capabilities.drop is not [ALL] (got '[$dropped]')"

  # seccompProfile, like runAsNonRoot, counts wherever PSS finds it.
  seccomp="$(read_field "$kind" "$name" "$container" \
    '[$c.securityContext.seccompProfile.type, $pod.securityContext.seccompProfile.type] | map(select(. != null)) | .[0]')"
  [ "$seccomp" = 'RuntimeDefault' ] || fail "$id: seccompProfile.type is not RuntimeDefault (got '$seccomp')"

  privileged="$(read_field "$kind" "$name" "$container" '$c.securityContext.privileged')"
  [ "$privileged" = 'false' ] || fail "$id: privileged is not false (got '$privileged')"

  automount="$(read_field "$kind" "$name" "$container" '$pod.automountServiceAccountToken')"
  [ "$automount" = 'false' ] || fail "$id: automountServiceAccountToken is not false (got '$automount')"

  rootfs="$(read_field "$kind" "$name" "$container" '$c.securityContext.readOnlyRootFilesystem')"
  [ "$rootfs" = 'true' ] || fail "$id: readOnlyRootFilesystem is not true (got '$rootfs')"

  for path in $WRITABLE_PATHS; do
    mounted="$(read_field "$kind" "$name" "$container" \
      "[\$c.volumeMounts[] | select(.mountPath == \"$path\")] | length")"
    [ "$mounted" = '1' ] || fail "$id: expected exactly one mount at $path (got '$mounted')"
  done

  echo "checked $id"
done <<<"$containers"

if [ "$failures" -ne 0 ]; then
  echo "$failures security-context assertion(s) failed" >&2
  exit 1
fi

echo "all rendered pods meet the restricted profile"
