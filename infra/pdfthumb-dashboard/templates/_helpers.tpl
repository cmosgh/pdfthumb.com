{{/*
Expand the name of the chart.
*/}}
{{- define "pdfthumb-dashboard.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
If release name contains chart name it will be used as a full name.
*/}}
{{- define "pdfthumb-dashboard.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "pdfthumb-dashboard.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "pdfthumb-dashboard.labels" -}}
helm.sh/chart: {{ include "pdfthumb-dashboard.chart" . }}
{{ include "pdfthumb-dashboard.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "pdfthumb-dashboard.selectorLabels" -}}
app.kubernetes.io/name: {{ include "pdfthumb-dashboard.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
The release's namespace, which must be .Values.namespace: the deploy
credential's Role only covers that one.
*/}}
{{- define "pdfthumb-dashboard.namespace" -}}
{{- if ne .Release.Namespace .Values.namespace -}}
{{- fail (printf "this chart deploys only to namespace %q, got %q (pass -n %s)" .Values.namespace .Release.Namespace .Values.namespace) -}}
{{- end -}}
{{- .Release.Namespace -}}
{{- end }}

{{/*
The image reference, as the backend chart builds it.

Without image.digest: "<repository>:<tag>", the tag defaulting to appVersion.
With image.digest:    "<repository>:<tag>@<digest>", or "<repository>@<digest>"
when no tag is set. The runtime pulls by the digest; the tag only names the
build. A new digest is always a pod-spec change, so a rebuild always rolls out.
*/}}
{{- define "pdfthumb-dashboard.image" -}}
{{- $repository := .Values.image.repository -}}
{{- with .Values.image.digest -}}
{{- if not (regexMatch "^sha256:[a-f0-9]{64}$" .) -}}
{{- fail (printf "image.digest must be sha256:<64 lowercase hex characters>, got %q" .) -}}
{{- end -}}
{{- if $.Values.image.tag -}}
{{- printf "%s:%s@%s" $repository $.Values.image.tag . -}}
{{- else -}}
{{- printf "%s@%s" $repository . -}}
{{- end -}}
{{- else -}}
{{- printf "%s:%s" $repository (.Values.image.tag | default .Chart.AppVersion) -}}
{{- end -}}
{{- end }}
