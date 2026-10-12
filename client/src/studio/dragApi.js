// Bridge between DOM/R3F event handlers and the DragController, which lives
// inside the Canvas and owns the camera/raycaster. The controller fills these in.
export const dragApi = {
  /** Pointer pressed on an item already in the room. */
  pressItem: () => {},
  /** Pointer pressed on a catalogue card (drag it into the room, or click to add). */
  pressProduct: () => {},
  /** Rotate whatever is being dragged (radians). */
  rotateDrag: () => {},
  /** Cancel the current drag. */
  cancel: () => {},
  /** Grab a JPEG of the current view: (width) => dataURL */
  capture: () => null,
}
