# Design Notes

## Frame-level Annotations

### Bounding Boxes

| Attribute | Description |
|-----------|-------------|
| x         | x-coordinate of top-left corner (**required**) |
| y         | y-coordinate of top-left corner (**required**) |
| width     | bounding box width (**required**) |
| height    | bounding box height (**required**) |
| labelId   | object type contained in bounding box |
| instanceId | integer indicating the instance of this type |
| trackId   | integer indicating the track that this object belongs to (unique within a frame) |
| colour    | colour to render the bounding box (overrides label colour) |
| score     | score or confidence associated with the bounding box |
| comment   | free-text comment |

**Operations:** add, delete, edit, move, resize, copy (to another frame), visualize, interpolate (between two frames, objects with same `trackId`)

### Polygon Regions

TODO

### Human and Hand Poses (Skeletons)

TODO

## Video-level Annotations

### Keypoints

| Attribute | Description |
|-----------|-------------|
| timestamp | timestamp associated with the keyframe |

**Operations:** generate (sequence), add, delete, jump to, jump to next, visualize, export frames

### Video Segments (Clips)

| Attribute | Description |
|-----------|-------------|
| start     | beginning of clip (in seconds) (**required**) |
| end       | end of clip (in seconds) (**required**) |
| description | free-text description of the video segment |
| actionId  | action associated with the video segment |

**Operations:** add, remove, edit, jump to

## File Formats

### Video Files

Any video that can be processed by the HTML5 `video` element.

### Configuration (Object and Action Labels)

Stored as colon-separated pairs of `labelId` and (default) `colour`, one per line.
The `labelId` should be a string composed of letters, numbers and underscore.
The `colour` is a `#` followed by hexadecimal byte codes for red, green and blue (e.g., `#ff0000` for red).

### Annotations

TODO --- indexed by time (not frame)

### Preferences

User preferences (such as GUI options) are saved in browers local storage between sessions.
