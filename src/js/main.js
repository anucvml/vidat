let v = null

function init () {
    v = new ANUVidLib(updateGUI)

    const loadVideoFile = function (event) {
        const file = this.files[0]
        const fileURL = URL.createObjectURL(file)
        v.loadVideo(fileURL)
    }

    const input = document.querySelector('#videoinput')
    input.addEventListener('change', loadVideoFile, false)
    document.getElementById('version').innerHTML = VERSION
    updateGUI(v)
}

function fini () {
    if (v != null) v.prefs.save()
}

// update visual state of GUI to reflect preferences
function updateGUI (vidLibObj) {
    // get checkboxes and visual elements into correct state
    if (vidLibObj.prefs.tiedframes !== document.getElementById('tiedcb').checked)
        document.getElementById('tiedcb').click()
    if (vidLibObj.prefs.greyframes !== document.getElementById('greycb').checked)
        document.getElementById('greycb').click()
    if (vidLibObj.prefs.showkeyframes !== document.getElementById('showkfcb').checked)
        document.getElementById('showkfcb').click()
    if (vidLibObj.prefs.showobjects !== document.getElementById('showobjscb').checked)
        document.getElementById('showobjscb').click()
    if (vidLibObj.prefs.showobjects !== document.getElementById('showregscb').checked)
        document.getElementById('showregscb').click()
    if (vidLibObj.prefs.showvidsegs !== document.getElementById('showvidsegcb').checked)
        document.getElementById('showvidsegcb').click()

    // show configuration (when menu is visible)
    let cfg = vidLibObj.lblConfig
    document.getElementById('objectlabels').value = cfg.toString(cfg.objectLabels)

    document.getElementById('actionlabels').value = cfg.toString(cfg.actionLabels)
    document.getElementById('annotationinfo').innerHTML = vidLibObj.annotations.getInfoString()

    const isInvalidVideo = isNaN(vidLibObj.video.duration)
    document.getElementById('loadannobtn').disabled = isInvalidVideo
    document.getElementById('saveannobtn').disabled = isInvalidVideo
    document.getElementById('clearannobtn').disabled = isInvalidVideo

    // redraw annotation data
    vidLibObj.drawKeyframes()
    vidLibObj.refreshVidSegTable()
    vidLibObj.resize()
    //vidLibObj.redraw();
}

function clearAllAnnotations () {
    const result = confirm('Are you sure you want to clear all annotations?')
    if (result) {
        v.annotations.clear()
        updateGUI(v)
    }
}

function play () {
    if (isNaN(v.video.duration)) {
        return
    }
    document.getElementById('playeroverlay').style.display = 'block'
    const startTime = Math.min(v.leftPanel.timestamp, v.rightPanel.timestamp)
    const endTime = Math.max(v.leftPanel.timestamp, v.rightPanel.timestamp)
    document.getElementById('vidplayer').src = v.video.src + '#t=' + startTime + ',' + endTime
}

// toggle zoom
function zoom () {
    if (document.getElementById('rightpanel').style.display === 'none') {
        document.getElementById('leftpanel').style.width = '45%'
        document.getElementById('centerpanel').style.display = 'block'
        document.getElementById('rightpanel').style.display = 'block'
    } else {
        document.getElementById('leftpanel').style.width = '100%'
        document.getElementById('centerpanel').style.display = 'none'
        document.getElementById('rightpanel').style.display = 'none'
    }
    v.resize()
    v.resize()
}

function showmenu () {
    // update GUI with configuration
    updateGUI(v)

    // animate menu open
    document.getElementById('menuoverlaydiv').style.display = 'block'
    document.getElementById('menudiv').style.display = 'block'
    if ('animateclose' in document.getElementById('menupanel').classList) {
        document.getElementById('menupanel').classList.remove('animateclose')
    }
    if (!('animateopen' in document.getElementById('menupanel').classList)) {
        document.getElementById('menupanel').classList.add('animateopen')
    }
}

function hidemenu () {
    let cfg = v.lblConfig
    cfg.objectLabels = cfg.fromString(document.getElementById('objectlabels').value)
    cfg.actionLabels = cfg.fromString(document.getElementById('actionlabels').value)

    // animate menu closed
    if ('animateopen' in document.getElementById('menupanel').classList) {
        document.getElementById('menupanel').classList.remove('animateopen')
    }
    if (!('animateclose' in document.getElementById('menupanel').classList)) {
        document.getElementById('menupanel').classList.add('animateclose')
    }
    document.getElementById('menuoverlaydiv').style.display = 'none'
    setTimeout(function () {
        document.getElementById('menudiv').style.display = 'none'
        document.getElementById('menupanel').classList.remove('animateclose')
    }, 400)
    v.redraw()
}

function showhelp () {
    document.getElementById('helpoverlay').style.display = 'block'
}

function showabout () {
    document.getElementById('aboutoverlay').style.display = 'block'
}

document.addEventListener('keyup', (e) => { return onkeypress(e) })

function onkeypress (e) {
    // don't process key if inside a textbox or a drop-down list
    if ((e.target.nodeName.toLowerCase() === 'input') && (e.target.type.toLowerCase() === 'text')) {
        return false
    }
    if (e.target.nodeName.toLowerCase() === 'select') {
        return false
    }
    // don't process key if menu is showing (TODO: can this be replaced by assigning an onkeypress event to the menu div?)
    if (document.getElementById('menudiv').style.display === 'block') {
        return false
    }

    console.log('key ' + e.code + ' (0x' + e.keyCode.toString(16) + ')')
    switch (e.keyCode) {
        case 0x2E:  // delete
            v.deleteActiveObject()
            return true

        case 0x48:  // H
            showhelp()
            return true

        case 0x50:  // P
            play()
            return true

        case 0xBC:  // comma, <
            v.prevKeyframe()
            return true

        case 0xBE:  // period, >
            v.nextKeyframe()
            return true

        case 0xBB:  // plus, equals
            v.newVidSeg()
            return true

        case 0xDB:  // [, {
            document.getElementById('leftslider').focus()
            return true

        case 0xDD:  // ], }
            document.getElementById('rightslider').focus()
            return true

    }

    return false
}
