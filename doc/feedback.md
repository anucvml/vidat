# Feedback from users

This page includes unedited feedback from users. Not all feedback relates to the annotation tool (e.g., some relates to future integration with back-ends for crowd sourcing and/or use of the data in downstream applications).

## 4 August 2020

```
Interface:
1. would be nice to be able to delete more than one row at a time. #28
2. Overlay action label text on video. #33
3. When labelling actions, after submitting an entry, have the end of the last action jump to be the start of the next action (saves a lot of time). #26
4. For multi-person videos maybe allow to somehow label the non-assembler (with a bounding box) - not sure if this is super important.
5. skeleton - first block out the person and enlarge that region for improved accuracy.

Functionality (mainly for action): #26
1. Hierarchical action segments : assembly -> sub-assembly -> atomic actions. Allow user to first label sub-assemblies (assemble leg) and then separately load them and label atomic actions within each sub-assembly (pick up leg, screw-in leg, tighten leg).
2. Atomic actions: composed of drop-down menus of verbs and drop down of objects  + option to add free description text. drop-down lists to be loaded from taxonomy files. should automatically filter out impossible pairs (can't screw in a table-top).
3. Have the database allow for multiple action labels for the same frame (someone can spin a leg with one hand and pick up another leg with the other hand).
```

```
- According to the bounding box annotation, it would be good if the mouse cursor shape change to + when it is ready to draw a bounding box. #34
- It would be good also if a symbol appears on a corner of the bounding box for selecting that box and after selecting the box, the color of the box change, and then one can use "Delete" on the keyboard to delete the box or use arrow keys to move it. Also, for resizing, it would be good if the mouse cursor change to some diagonal arrow symbol on the corners.
- Any single click on the frame creates an object instance which is a little bit weird. #35
- I also couldn't test the region and skeleton mode. Maybe it is not implemented yet or maybe I couldn't figure out how to use them. (not implemented yet, #8 #9)
```

```
I certainly believe that the current prototype of the annotation tool covers or will cover (after some iterations) everything that we need for doing the spatial, temporal, and natural-language annotation for the research on video analysis. However, I would like to point out some things about the use of this tool in the Amazon Mechanical Turk platform.

I believe it is important to consider the annotation tool for two purposes. Of course the annotation process itself and the evaluation of the annotators. Turkers want to get their payment as soon as they can. Actually, they want to receive their payment between two or three days. If we want to assess the annotations in time. We need a tool that facilitates the evaluation of annotations and annotators. It is for that reason that I believe this tool should have two purposes in mind.

(remainder of feedback provides some experience in this regard---to be considered once we start integration with mtruk). #37
```

```
All suggestions sound very helpful. The "Lock Sliders" function seems weird, I can't think of anything else at the moment. So I tested with several browsers ...

Works well on Google Chrome.
Works well on Microsoft Edge v.84 (2020)

Blank page on Microsoft Edge v.44 (2019)
Blank page on Internet Explorer v.11

Can't load videos on Apple Safari v13 (2020). #5
```

```
- I would like to import a list of keyframes from a file. Using one frame every second or so is just one alternative for keyframes selection, and it depends on what we want to do. For example, in the Spatio-temporal graph, I used Laplace variance for keyframe selection. Essentially, Keyframes needs to be flexible. #38

- It would be nice to get the option of aligning transcripts with the video. Something like this, please take a look at the video or demo, https://berndhuber.github.io/bscript/. So there is a synchronization between the transcript or script and the time in the video when the person says that word. It would be nice not just for tasks similar to the multi-modal opinion mining in video reviews but also video dense captioning. #39

- Even If we don't tackle the assess of annotators (previous email), I would like to have the annotations in a SQL database. Although, in the end, we can share JSON files with the community, I would prefer SQL for the trackability of the annotation process, scalability, simplicity, and order. sqlite3 it is a good and easy option. #40
```
