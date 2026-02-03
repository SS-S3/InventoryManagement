# Terms of Service and Privacy Policy

This directory contains the legal documents displayed to users during registration.

## Files

### `terms-of-service.ts`

Contains the Terms of Service content that users must accept before registering.

### `privacy-policy.ts`

Contains the Privacy Policy content that users must accept before registering.

### `terms-privacy-modal.tsx`

React component that displays both documents in a modal dialog during user registration.

## Updating Content

To update the Terms of Service or Privacy Policy:

1. Edit the respective `.ts` file (`terms-of-service.ts` or `privacy-policy.ts`)
2. Update the exported string constant with your new content
3. The content supports basic formatting with line breaks (use `\n` for new lines)
4. Test the changes by running the application and checking the registration flow

## Content Guidelines

- Use clear, simple language
- Include all necessary legal requirements for your jurisdiction
- Be specific about data usage, especially for competition registration
- Include contact information for questions
- Keep the content concise but comprehensive
- Use numbered sections for easy reference

## Integration

The modal is automatically displayed when users click on "Terms of Service" or "Privacy Policy" links in the registration form. Users must check both acceptance checkboxes and click "Accept & Continue" to proceed with registration.
