<div align="center">
<!--   <a href="https://www.anu.edu.au/" target="_blank">
    <img src="src/img/logo.png" alt="ANU logo">
  </a> -->

  # ANU CVML Video Annotation Tool

  _A video annotation tool developed by the ANU._

</div>

The aim of this project is to develop a high-quality video annotation tool for computer vision and machine learning applications with the following desiradata:

1. Simple and efficient to use for a non-expert.
2. Supports multiple annotation types including temporal segments, object bounding boxes, semantic and instance regions, tracklets, and human pose (skeleton).
3. Runs in a browser without external libraries or need for server-side processing. But easy to plug-in a back-end for heavy "in-the-loop" processing (e.g., segments from bounding boxes or frame completion from partial labels).
4. Integrates easily with crowd-sourced annotation services (e.g., Amazon Mechanical Turk).
5. Compatible with all (most) modern browsers and operating systems including tablets.
6. Open-source.

Video tutorials will be posted on YouTube.

## Installation

1. Copy all files from `src` into a single directory.
2. Put all files behind a web server ([Nginx](http://nginx.org/), [Apache](http://httpd.apache.org/), etc.).
3. Open in your favourite browser.

## URL Parameters

|       key       |              value              |          description           |
| :-------------: | :-----------------------------: | :----------------------------: |
|     `mode`      | `objects`, `region`, `skeleton` |        set current mode        |
|  `showObjects`  |         `true`/`false`          |      show objects or not       |
|  `showRegions`  |         `true`/`false`          |      show regions or not       |
| `showSkeletons` |         `true`/`false`          |     show skeletons or not      |
|  `showActions`  |         `true`/`false`          |      show actions or not       |
|     `debug`     |         `true`/`false`          | auto load a video and no cache |

## Development

### Requirements

1. [Vue.js](https://vuejs.org/)
2. [Quasar](https://quasar.dev/)
3. [JSZip](https://stuk.github.io/jszip/)

### Optional

1. [WebStorm](https://www.jetbrains.com/webstorm/)
2. [Gitmoji](https://github.com/carloscuesta/gitmoji)
