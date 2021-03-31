# Example Backend Server

The ANU CVML Video Annotation Tool (Vidat) works just fine as a browser-based tool where you can
load videos and save annotations to your local machine. Used in this way workers do not need to
install any software and can make use of our existing hosts:

<div align="center">

_[Host1](http://users.cecs.anu.edu.au/~sgould/vidat/)_
| _[Host2](https://vidat.davidz.cn)_
| _[Demo1](http://users.cecs.anu.edu.au/~sgould/vidat/?video=needinput.mp4&config=needinputconfig.json)_
| _[Demo2](https://vidat.davidz.cn/?video=needinput.mp4&annotation=needinput.json#/annotation)_

</div>

Vidat can also be integrated with a backend server for submitting user annotations and managing
larger labelling tasks.

In this example we use node `nodejs` to build a simple backend server. Other web frameworks can be
used instead of `nodejs`. The backend makes use of the `submitURL` parameter provided to the Vidat
tool. Note that in this example we do not consider security issues such as user authentication, but
these should be carefully considered for any real application since the server will be responding
to user requests and writing files to disk.

## What does the example demonstrate?

When run the example will serve a webpage that shows a list of videos to be annotated. Clicking on
a video will open the Vidat tool and allow the user to submit annotations back to the server. These
annotations will be saved and made available the next time the video is opened for editing. In the
current version the main webpage will need to be refershed after submitting an annotation to reflect
the changes. Newly submitted annotations override any existing annotations for a given video.

## Installation
  
To run the demo, install `nodejs`, `npm` and various modules. And link the static Vidat browser
code to the subdirectory `vdiat`.
  
```
npm install --save express ejs body-parser cors

ln -s ../../src vidat
```

Detailed instructions for installing `express` can be found at https://expressjs.com/en/starter/installing.html.

Now copy any videos you would like annotated to `vidat/video`.
Corresponding annotations will be saved in `vidat/annotation`.

## Running

1. Open a terminal and run `node index.js`
2. Open a web broswer and navigate to `http://localhost:3000/`
