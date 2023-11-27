// index.js
// Copyright (C) 2021, ANU CVML

// --- setup ----------------------------------------------------------------------

const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')

const app = express()
const port = process.env.PORT || 3000

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// public assets
app.use(express.static(path.join(__dirname, 'public')))

// handling posts
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// static serving of vidat
app.use('/vidat', express.static('vidat'))
const vidat = 'http://localhost:' + port + '/vidat'
const submit = 'http://localhost:' + port + '/'

// --- helper functions -----------------------------------------------------------

function get_videos(base) {
  videos = {}

  // read video directory
  fs.readdirSync(path.join(base, 'video')).forEach((file) => {
    //console.log(file)
    ext = file.split('.').pop()
    if (ext == 'avi' || ext == 'mp4') {
      name = file.substr(0, file.length - ext.length - 1)
      videos[name] = { video: file, annotation: null }
    }
  })

  // read annotation directory
  fs.readdirSync(path.join(base, 'annotation')).forEach((file) => {
    //console.log(file)
    ext = file.split('.').pop()
    if (ext == 'json') {
      name = file.substr(0, file.length - ext.length - 1)
      if (name in videos) {
        videos[name].annotation = file
      }
    }
  })

  return videos
}

// --- routes ---------------------------------------------------------------------

app.get('/', (req, res) => {
  videos = get_videos(path.join(__dirname, 'vidat'))
  res.render('index.ejs', { videos: videos, vidaturl: vidat, submission: submit })
})

app.post('/', (req, res) => {
  const name = req.query.token
  const json = JSON.stringify(req.body)

  if (name == null) {
    return res.status(500).send('Invalid token')
  }

  const base = path.join(path.join(__dirname, 'vidat'), 'annotation')
  fs.writeFile(path.join(base, name + '.json'), json, (err, data) => {
    if (err) {
      console.log(err)
      return res.status(500).send('Server error!')
    }
    res.send('Annotation saved!')
  })
})

// --- launch application ---------------------------------------------------------

console.log('Server listening on port ' + port)
app.listen(port)
