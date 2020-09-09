# Documentation for Vidat

## What is Vidat

An in-browser video annotation tool developed by [ANU CVML](https://github.com/anucvml).

## How to build Vidat

There is no building or compiling. Just put all files behind a web server ([Nginx](http://nginx.org/), [Apache](http://httpd.apache.org/), etc.) or use the built-in web server of WebStorm.

## Further development

### Stacks

1. [Vue.js](https://vuejs.org/) JavaScript framework
2. [Vue Router](https://router.vuejs.org/) Router for Vue
3. [Vuex](https://vuex.vuejs.org/) Store for Vue
4. [Quasar](https://quasar.dev/) Component framework. [UMD](https://quasar.dev/start/umd) mode.
5. [JSZip](https://stuk.github.io/jszip/) Exporting and importing zip file

### Tools

1. [WebStorm](https://www.jetbrains.com/webstorm/) IDE
2. [Gitmoji](https://github.com/carloscuesta/gitmoji) Git commit

### File Structure

```
.
├── doc
│ ├── design
│ │ ├── app.md # design documentation for app.js
│ │ ├── main.md # main design documentation
│ │ └── pages # design documentation for each page
│ │     ├── about.md
│ │     ├── annotation.md
│ │     ├── configuration.md
│ │     ├── help.md
│ │     ├── notfound.md
│ │     └── preference.md
│ ├── feedback.md
│ └── img
│     └── prototype.png
├── LICENSE
├── README.md
└── src
    ├── archive # prototype
    │ ├── anno.js
    │ ├── anucvml.css
    │ ├── anuvidlib.js
    │ ├── design_notes.md
    │ └── main.js
    ├── archive.html # prototype index
    ├── css
    │ └── main.css
    ├── font
    │ └── material-icons.woff2
    ├── img
    │ ├── 404.svg
    │ ├── filmstrip.png
    │ └── logo.png
    ├── index.html # index
    └── js
      ├── app.js # main entry
      ├── components # components for app.js
      │ ├── drawer.js
      │ └── videoLoader.js
      ├── libs
      │ ├── annotationlib.js
      │ └── utils.js
      ├── pages # each page contains its main entry and all related components
      │ ├── about
      │ │ ├── about.js
      │ │ └── components
      │ │     └── contributorCard.js
      │ ├── annotation
      │ │ ├── annotation.js
      │ │ └── components
      │ │     ├── actionTable.js
      │ │     ├── annotationSkeleton.js
      │ │     ├── canvasPanel.js
      │ │     ├── controlPanel.js
      │ │     ├── filmStrip.js
      │ │     ├── keyframePanel.js
      │ │     ├── keyframeTable.js
      │ │     ├── objectTable.js
      │ │     ├── regionTable.js
      │ │     └── skeletonTable.js
      │ ├── configuration
      │ │ ├── components
      │ │ │ ├── actionLabelTable.js
      │ │ │ ├── objectLabelTable.js
      │ │ │ ├── skeletonTypePreview.js
      │ │ │ └── skeletonTypeTable.js
      │ │ └── configuration.js
      │ ├── help
      │ │ ├── components
      │ │ └── help.js
      │ ├── notfound
      │ │ ├── components
      │ │ └── notfound.js
      │ └── preference
      │     └── preference.js
      ├── router
      │ └── router.js
      └── store
          ├── modules
          │ ├── annotation.js
          │ └── settings.js
          ├── store.js
          └── validation.js
```
