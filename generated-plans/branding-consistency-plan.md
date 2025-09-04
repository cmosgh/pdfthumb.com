# Branding Consistency Fix Plan

## Problem Statement
The application has inconsistent branding between the header and footer:
- **Header**: Shows "PDFThumb" 
- **Footer**: Shows "PDFThumb.io"

This creates brand confusion and looks unprofessional.

## Current Analysis

### Findings from Codebase Search:
1. `src/constants.ts:21` - `export const APP_NAME = "PDFThumb";`
2. `src/components/Footer.tsx:21` and `:80` - Hardcoded "PDFThumb.io"
3. `README.md` - Uses "PDFThumb.io" as the official project name

### Root Cause:
- The header uses the `APP_NAME` constant which is set to "PDFThumb"
- The footer hardcodes "PDFThumb.io" instead of using the constant
- The README indicates "PDFThumb.io" is the official brand name

## Recommended Solution
Standardize on "PDFThumb.io" as the consistent brand name throughout the application, as it appears to be the official name based on the README documentation.

## Implementation Steps

### Step 1: Update Constants
- File: `src/constants.ts`
- Change: Update `APP_NAME` from `"PDFThumb"` to `"PDFThumb.io"`
- Impact: This will automatically update the header and any other components using this constant

### Step 2: Update Footer to Use Constants
- File: `src/components/Footer.tsx`
- Change: Replace hardcoded "PDFThumb.io" with `{APP_NAME}` import
- Benefit: Future brand changes only need to be made in one place

### Step 3: Search for Other Instances
- Search for any remaining hardcoded instances of "PDFThumb" without ".io"
- Update any found instances to maintain consistency

### Step 4: Consider Creating Multiple Brand Variants (Optional)
If different contexts need different versions, create:
- `APP_NAME_FULL = "PDFThumb.io"` (for footer, official documents)
- `APP_NAME_SHORT = "PDFThumb"` (for navigation, limited space)

## Testing & Verification

### Visual Testing:
1. Start development server: `npm run dev`
2. Navigate to homepage and verify header shows "PDFThumb.io"
3. Check footer shows consistent "PDFThumb.io"
4. Navigate through all pages (Features, Pricing, Docs) to verify consistency

### Code Verification:
1. Search codebase for remaining instances: `grep -r "PDFThumb" src/`
2. Ensure all instances are intentional and consistent

## Files to Modify:
1. `src/constants.ts` - Update APP_NAME constant
2. `src/components/Footer.tsx` - Use constant instead of hardcoded text

## Expected Outcome:
- Consistent "PDFThumb.io" branding across header and footer
- Single source of truth for brand name in constants
- Professional, cohesive brand presentation