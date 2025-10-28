What we have done:

- UI base
- modularization of the animation editor
- tracklist implementation
- animation models
- animation modes for multitrack animations
- animation editor layout
- OSC input manager
- OSC output manager
- many other features...

What we need to keep:

- professional grade UI
- production ready application
- OSC synchronized communications (input and output with balanced throttling and priority)
- 3D real-time rendering
- control points editor
- tracks importation from holophonix mechanism
- realtime osc output
- UI/UX clean, non-complex and professional

What we need to work on:

- test all animation models and modes on individual and group tracks
- think about our animation stack (animation models + animation modes) could be enhanced to permit animation combinations.
- think about how saved animations can be saved and loaded/recalled (maybe rethinking our actual presets system)
- think about how apply animation saved to selected track, track groups etc...
- new track creation thru tracklist, it shouldn't be possible to create unindexed tracks. index should be auto-incremented regarding the rest of the tracklist. Initial coordinates/name  and color should be editable during the creation process. Create a track should send OSC messages to holophonix to create a track, set its name, color and initial coordinates. (Implemented)
- add a 'Go To Start' easing before playback to move tracks from current positions to animation start (t=0). (Implemented)
- OSC communication manager should verify the availability of the holophonix device when connection is initialized. If the device is not available, the application should display a warning message.Holophonix device availability should be checked at regular intervals.
- OSC input listener should be able to receive dedicated messages from other device to manage (as minimum) animations playback. A complete OSC input messages specification should be documented and accessible for the user. User should be able to copy these kind of OSC paths (controlling app paths) directly in app to paste them in an external app, maybe right-clicking on buttons which control animations playback and on other buttons, fields etc...
- In OSC manager, we've actually implemented a Message Interface permitting to send custommessgaes to connected Holophonix devices. This should be rethought to only send  well defined messages to holophonix device regarding Holophonix device OSC specifications (C:\Users\Administrateur\Documents\GitHub\holophonix-animator\v2\OSC_SPECS).

What we need to rethink (and evaluate what is effectively possible):

- rationalize the number of animation models by thinking of certain models as variants or combinations of the basic model (e.g. the Helix model can be seen as a combination of the circular model and the linear model, the spiral model can be seen as a variant of the circular model of which one of the parameters - the radius - evolves over time...)

- animation editor layout tweaks :  user should be able to  choose from a set of pre-defined layouts and switch between them.
- pre-defined models: quad-view(3d, 2d front, 2d top, 2d side), one-view(3d), one-view(2d front), one-view(2d top), one-view(2d side), two-view(3d, 2d front), two-view(3d, 2d top), two-view(3d, 2d side), two-view(2d front, 2d top), two-view(2d front, 2d side), two-view(2d top, 2d side).
-animation settings should be a right overlay collapsible panel (like left menubar) and organized in categories.
-how tracklist should display track groups, animation applied to track groups etc...
-how user can edit track groups in tracklist

Future work:

- work on tracks groups: tracks can be grouped and animated as a single entity. But tracks can also be animated independently. one track can be part of multiple groups. How to handle this?
- animation models combinations: if a track is part of different groups, and animated with different models (indiviually or as groups), how to handle this?


First feedbacks about animation models and modes:
Control points aren't displayed initially in control points editor. User should change their coordinates in form to see them displayed.
 rest of feedbacks from models and modes are still to be collected.

