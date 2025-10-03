# Screen Reader Testing Guide

## Overview

This guide provides instructions for testing the GameLearn platform with screen readers to ensure WCAG 2.1 AA compliance.

## Recommended Screen Readers

### Windows
- **NVDA (Free)**: https://www.nvaccess.org/download/
- **JAWS (Commercial)**: https://www.freedomscientific.com/products/software/jaws/

### macOS
- **VoiceOver (Built-in)**: Press `Cmd + F5` to enable
- **NVDA with Wine (Free alternative)**

### Linux
- **Orca (Free)**: Pre-installed on many Linux distributions

### Mobile
- **iOS VoiceOver (Built-in)**: Settings → Accessibility → VoiceOver
- **Android TalkBack (Built-in)**: Settings → Accessibility → TalkBack

## Testing Checklist

### Global Navigation
- [ ] Skip links are announced and functional (press Tab on page load)
- [ ] Main navigation menu is properly announced with role="navigation"
- [ ] Current page is indicated with aria-current="page"
- [ ] Logo link has descriptive label "GameLearn home"
- [ ] Footer navigation is announced with proper labels

### Forms and Inputs
- [ ] All form labels are read aloud with corresponding inputs
- [ ] Required fields are announced as "required"
- [ ] Error messages are announced immediately when validation fails
- [ ] Success messages are announced on form submission
- [ ] Placeholder text is not the only label (labels must be present)
- [ ] Checkbox and radio button states are announced correctly

### Interactive Components

#### Video Player
- [ ] Video controls are announced with their current state
- [ ] Play/Pause button announces "Play" or "Pause"
- [ ] Volume slider is announced with current volume level
- [ ] Progress bar is announced with current time and duration
- [ ] Quality and speed settings are announced in dropdowns
- [ ] Keyboard shortcuts work as documented

#### Course Cards
- [ ] Course title is announced
- [ ] Instructor name is announced
- [ ] Rating is announced as "X out of 5 stars from Y reviews"
- [ ] Price is announced correctly
- [ ] Enroll/Continue button has descriptive label with course title
- [ ] Tags and badges are announced with proper context

#### Lesson Navigation
- [ ] Lesson list is announced as a list
- [ ] Each lesson status is announced (completed, in progress, locked)
- [ ] Lesson duration is announced
- [ ] Previous/Next buttons announce the lesson they navigate to
- [ ] Locked lessons are announced as disabled

### Dynamic Content
- [ ] Loading states are announced "Loading X"
- [ ] Success messages are announced assertively
- [ ] Error messages are announced assertively
- [ ] Form validation errors are announced on field blur
- [ ] Status updates are announced politely

### Dialogs and Modals
- [ ] Dialog title is announced when opened
- [ ] Focus moves to dialog when opened
- [ ] Focus is trapped within dialog (Tab doesn't leave dialog)
- [ ] Escape key closes dialog
- [ ] Focus returns to trigger element when closed
- [ ] Close button is announced properly

## Common NVDA Commands

- `NVDA + Down Arrow`: Read next item
- `NVDA + Up Arrow`: Read previous item
- `NVDA + Space`: Enter/exit forms mode
- `H`: Navigate to next heading
- `B`: Navigate to next button
- `F`: Navigate to next form field
- `L`: Navigate to next list
- `I`: Navigate to next list item
- `K`: Navigate to next link
- `NVDA + T`: Read window title
- `NVDA + B`: Read entire page

## VoiceOver Commands (macOS)

- `VO + A`: Read all
- `VO + Right Arrow`: Next item
- `VO + Left Arrow`: Previous item
- `VO + Space`: Activate item
- `VO + H H`: Open Help menu
- `VO + U`: Open rotor (navigation menu)
- `VO + Cmd + H`: Navigate by heading
- `VO + Cmd + L`: Navigate by link
- `VO + Cmd + J`: Navigate by form control

## Testing Scenarios

### Scenario 1: Course Enrollment Flow
1. Navigate to courses page
2. Browse courses using screen reader navigation
3. Select a course to view details
4. Verify all course information is announced
5. Proceed to checkout
6. Verify form labels and error states
7. Complete purchase and verify success message

### Scenario 2: Video Lesson Playback
1. Enroll in a course
2. Navigate to lesson page
3. Interact with video player using keyboard shortcuts
4. Verify all controls are announced
5. Test caption toggle
6. Test quality/speed settings

### Scenario 3: Instructor Course Creation
1. Navigate to instructor dashboard
2. Create a new course
3. Verify form field labels
4. Add requirements, objectives, and tags
5. Verify dynamic list updates are announced
6. Submit form and verify success

## Known Issues and Workarounds

### Issue: NVDA Sometimes Doesn't Announce Dynamic Updates
**Workaround**: Ensure ARIA live regions are set to `polite` or `assertive` depending on urgency.

### Issue: VoiceOver on Safari Has Delay with React State Updates
**Workaround**: Add a small setTimeout before updating live region content (already implemented in LiveRegion component).

## Automated Testing Integration

While manual testing is essential, automated tests can catch many issues:

- **axe-core**: Browser extension for quick accessibility scans
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **pa11y**: Command-line accessibility testing

See `automated-testing-guide.md` for integration instructions.

## Reporting Issues

When reporting accessibility issues, include:

1. **Screen reader and version**: e.g., "NVDA 2023.1 on Windows 11"
2. **Browser and version**: e.g., "Firefox 115"
3. **Page/component**: e.g., "Checkout page - payment form"
4. **Expected behavior**: What should be announced
5. **Actual behavior**: What is actually announced
6. **Steps to reproduce**: Clear steps to trigger the issue

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Deque University](https://dequeuniversity.com/)

---

**Last Updated**: Task 18.6 - Screen Reader Testing Documentation
