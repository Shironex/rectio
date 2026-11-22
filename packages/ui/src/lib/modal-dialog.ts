export interface ModalDialogOptions {
  /** The caller's own element: an open dialog that contains it is not counted. */
  except?: Element | null;
}

/**
 * Whether the reader is inside an open modal dialog: a Dialog, AlertDialog, Sheet or Drawer that
 * holds the focus and hides the page. A page shortcut checks this so it never acts behind one.
 *
 * Base UI does not set `aria-modal`. What it does set, and what this reads: the open popup carries
 * its `role` (`dialog` or `alertdialog`) and `data-open`, and a modal one is portalled into a node
 * marked `data-base-ui-portal` beside an internal backdrop marked `data-base-ui-inert`, which takes
 * `inert` while the dialog closes. A non-modal popover (also `role="dialog"`) has no backdrop, so
 * it does not count. Plain DOM, no React: it runs only in event handlers.
 *
 * `except` is the caller's own element: a dialog that contains it does not count. A sidebar whose
 * phone sheet is the open dialog passes its panel, so its shortcut still closes that sheet, while
 * any other dialog open over it still blocks the shortcut.
 */
export function isModalDialogOpen({ except }: ModalDialogOptions = {}): boolean {
  const popups = document.querySelectorAll(
    '[role="dialog"][data-open], [role="alertdialog"][data-open]',
  );
  for (const popup of popups) {
    if (except != null && popup.contains(except)) continue;
    const portal = popup.closest('[data-base-ui-portal]');
    if (portal === null) continue;
    for (const child of portal.children) {
      if (child.hasAttribute('data-base-ui-inert') && !child.hasAttribute('inert')) return true;
    }
  }
  return false;
}
