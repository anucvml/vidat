from vidat import Vidat

if __name__ == "__main__":
    annotation_pathname = '../../src/annotation/needinput.json'
    video_pathname = '../../src/video/needinput.mp4'
    vidat = Vidat(annotation_pathname, video_pathname)

    # 1. version
    print(vidat.version)

    # 2. config
    config = vidat.config

    # 2.1 object label
    print(config.object_label)

    # 2.2 action label
    print(config.action_label)

    # 2.3 skeleton type
    print(config.skeleton_type)

    # 3 annotation
    annotation = vidat.annotation

    # 3.1 video
    video = annotation.video
    print(video)

    # 3.2 keyframe list
    keyframe_list = annotation.keyframe_list
    print(keyframe_list)

    # 3.3 objectAnnotationListMap
    objects = annotation.objects
    print(objects)

    # 3.3.1 query
    result = objects.query(label_id=1)
    print(result)

    # 3.3.2 show
    if len(result) != 0:
        result[0].show()

    # 3.4 regionAnnotationListMap
    regions = annotation.regions
    print(regions)

    # 3.4.1 query
    result = regions.query(label_id=1)
    print(result)

    # 3.4.2 show
    if len(result) != 0:
        result[0].show()

    # 3.5 skeletonAnnotationListMap
    skeletons = annotation.skeletons
    print(skeletons)

    # 3.5.1 query
    result = skeletons.query(type_id=0)
    print(result)

    # 3.5.2 show
    if len(result) != 0:
        result[0].show()

    # 3.6 actionAnnotationList
    actions = annotation.actions
    print(actions)

    # 3.6.1 query
    result = actions.query(start=0)
    print(result)

    # 3.6.2 show
    if len(result) != 0:
        result[0].show()
