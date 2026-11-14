/** Move keyboard focus to the first field marked invalid, after React renders the errors. */
export function focusFirstInvalid(): void {
  requestAnimationFrame(() => document.querySelector<HTMLElement>('main [aria-invalid="true"]')?.focus());
}
