import json
import cv2
import numpy as np
import datetime


def hex2rgb(hex):
    """
    convert color from hex to rgb
    :param hex: string like "#010101"
    :return: tuple of rgb
    """
    if len(hex) == 7:
        hex = hex[1:]
    r = int(f'0x{hex[:2]}', 16)
    g = int(f'0x{hex[2:4]}', 16)
    b = int(f'0x{hex[4:6]}', 16)
    return r, g, b


class _Video:
    """
    video of annotation file
    """

    def __init__(self, raw_video):
        self.__raw_video = raw_video

        self._src = raw_video["src"]
        self._fps = raw_video["fps"]
        self._duration = raw_video["duration"]
        self._frames = raw_video["frames"]
        self._width = raw_video["width"]
        self._height = raw_video["height"]
        self._ratio = self._width / self._height

    @property
    def src(self):
        return self._src

    @property
    def fps(self):
        return self._fps

    @property
    def duration(self):
        return self._duration

    @property
    def frames(self):
        return self._frames

    @property
    def width(self):
        return self._width

    @property
    def height(self):
        return self._height

    @property
    def ratio(self):
        return self._ratio

    def __str__(self):
        return str(self.__raw_video)


class _AnnotationBase:
    """
    base class for each individual annotation (object, region, skeleton)
    """

    def __init__(self, frame, raw_annotation, video, config, cap):
        self._frame = frame
        self._time = int(frame / video.fps)
        self._raw_annotation = raw_annotation
        self._instance = raw_annotation["instance"]
        self._score = raw_annotation["score"]
        self._video = video
        self._config = config
        self._cap = cap

    def _get_img(self):
        """
        read frame and return img using cv2
        :return: img mat
        """
        if not self._cap:
            raise Exception('Need to specify video_pathname!')
        self._cap.set(cv2.CAP_PROP_POS_MSEC, self._time * 1000)
        ret, img = self._cap.read()
        if not ret:
            raise Exception('Cannot read!')
        return img

    def show(self):
        """
        interface for showing the annotation with the frame rendered
        :return: None
        """
        raise NotImplemented

    @property
    def frame(self):
        return self._frame

    @property
    def raw_annotation(self):
        return self._raw_annotation

    @property
    def instance(self):
        return self._instance

    @property
    def score(self):
        return self._score


class _ObjectAnnotation(_AnnotationBase):
    def __init__(self, frame, raw_annotation, video, config, cap):
        super().__init__(frame, raw_annotation, video, config, cap)

        self._label_id = raw_annotation["labelId"]
        self._label = config.get_object_label_by_id(self._label_id)
        self._color = raw_annotation["color"]
        self._x = raw_annotation["x"]
        self._y = raw_annotation["y"]
        self._width = raw_annotation["width"]
        self._height = raw_annotation["height"]

    def show(self):
        img = self._get_img()
        color = hex2rgb(self.color);
        cv2.rectangle(
            img,
            (int(self.x), int(self.y)),
            (int(self.x + self.width), int(self.y + self.height)),
            color,
            2
        )
        cv2.imshow(
            f"Vidat - Object - {datetime.timedelta(seconds=self._time)} - {self.label['name']} {self.instance if self.instance else ''}",
            img)
        cv2.waitKey(0)

    @property
    def label_id(self):
        return self._label_id

    @property
    def label(self):
        return self._label

    @property
    def color(self):
        return self._color

    @property
    def x(self):
        return self._x

    @property
    def y(self):
        return self._y

    @property
    def width(self):
        return self._width

    @property
    def height(self):
        return self._height

    def __str__(self):
        info = {
            'label_id': self.label_id,
            'label': self.label['name'],
            'instance': self.instance,
            'score': self.score,
            'x': self.x,
            'y': self.y,
            'width': self.width,
            'height': self.height
        }
        return f"Object: {info}"


class _RegionAnnotation(_AnnotationBase):
    def __init__(self, frame, raw_annotation, video, config, cap):
        super().__init__(frame, raw_annotation, video, config, cap)

        self._label_id = raw_annotation["labelId"]
        self._label = config.get_object_label_by_id(self._label_id)
        self._color = raw_annotation["color"]
        self._point_list = raw_annotation["pointList"]
        self._n_point = len(raw_annotation["pointList"])

    def show(self):
        img = self._get_img()
        color = hex2rgb(self.color)
        points = np.array([[point['x'], point['y']] for point in self._point_list], dtype=np.int32)
        cv2.polylines(
            img,
            [points],
            1,
            color,
            2
        )
        for point in points:
            cv2.circle(
                img,
                tuple(point),
                4,
                color,
                -1
            )
        cv2.imshow(
            f"Vidat - Region - {datetime.timedelta(seconds=self._time)} - {self.label['name']} {self.instance if self.instance else ''}",
            img)
        cv2.waitKey(0)

    @property
    def label_id(self):
        return self._label_id

    @property
    def label(self):
        return self._label

    @property
    def color(self):
        return self._color

    @property
    def point_list(self):
        return self._point_list

    @property
    def n_point(self):
        return self._n_point

    def __str__(self):
        info = {
            'label_id': self.label_id,
            'label': self.label['name'],
            'instance': self.instance,
            'score': self.score,
            '#points': self.n_point
        }
        return f"Region: {info}"


class _SkeletonAnnotation(_AnnotationBase):
    def __init__(self, frame, raw_annotation, video, config, cap):
        super().__init__(frame, raw_annotation, video, config, cap)

        self._type_id = raw_annotation["typeId"]
        self._type = config.get_skeleton_type_by_id(self._type_id)
        self._color = raw_annotation["color"]
        self._center_x = raw_annotation["centerX"]
        self._center_y = raw_annotation["centerY"]
        self._point_list = raw_annotation["pointList"]
        self._edge_list = self._type['edgeList']

    def _get_point_tuple_by_id(self, idx):
        for point in self.point_list:
            if point['id'] == idx:
                return int(point['x']), int(point['y'])

    def show(self):
        img = self._get_img()
        color = hex2rgb(self.color)
        for point in [(int(point['x']), int(point['y'])) for point in self._point_list]:
            cv2.circle(
                img,
                point,
                4,
                color,
                -1
            )
        for edge in self._edge_list:
            from_id = edge['from']
            to_id = edge['to']
            from_point = self._get_point_tuple_by_id(from_id)
            to_point = self._get_point_tuple_by_id(to_id)
            cv2.line(
                img,
                from_point,
                to_point,
                color,
                2
            )
        cv2.imshow(
            f"Vidat - Skeleton - {datetime.timedelta(seconds=self._time)} - {self.type['name']} {self.instance if self.instance else ''}",
            img)
        cv2.waitKey(0)

    @property
    def type_id(self):
        return self._type_id

    @property
    def type(self):
        return self._type

    @property
    def color(self):
        return self._color

    @property
    def center_x(self):
        return self._center_x

    @property
    def center_y(self):
        return self._center_y

    @property
    def point_list(self):
        return self._point_list

    @property
    def edge_list(self):
        return self._edge_list

    def __str__(self):
        info = {
            'type_id': self.type_id,
            'type': self.type['name'],
            'instance': self.instance,
            'score': self.score,
            'centerX': self.center_x,
            'centerY': self.center_y,
        }
        return f"Skeleton: {info}"


class _ActionAnnotation:
    def __init__(self, raw_annotation, video, config, cap):
        self._raw_annotation = raw_annotation
        self.__video = video
        self.__config = config
        self.__cap = cap

        self._start = raw_annotation["start"]
        self._end = raw_annotation["end"]
        self._action_id = raw_annotation["action"]
        self._action = config.get_action_label_by_id(self._action_id)
        self._object_id = raw_annotation["object"]
        self._object = config.get_object_label_by_id(self._object_id)
        self._color = raw_annotation["color"]
        self._description = raw_annotation["description"]

    def show(self):
        if not self.__cap:
            raise Exception('Need to specify video_pathname!')
        time_interval = int(1000 / self.__video.fps)
        for current_time in range(int(self._start * 1000), int(self._end * 1000) + time_interval, time_interval):
            self.__cap.set(cv2.CAP_PROP_POS_MSEC, current_time)
            ret, img = self.__cap.read()
            if not ret:
                raise Exception('Cannot read!')
            cv2.imshow(
                f"Vidat - Action - {datetime.timedelta(seconds=self._start)}-{datetime.timedelta(seconds=self.end)} - {self._object['name']} - {self._action['name']} - {self._description}",
                img)
            # press any key to exit
            if cv2.waitKey(time_interval) != -1:
                break

    @property
    def raw_annotation(self):
        return self._raw_annotation

    @property
    def start(self):
        return self._start

    @property
    def start_frame(self):
        return int(self._start * self.__video.fps)

    @property
    def end(self):
        return self._end

    @property
    def end_frame(self):
        return int(self._end * self.__video.fps)

    @property
    def action_id(self):
        return self._action_id

    @property
    def action(self):
        return self._action

    @property
    def object_id(self):
        return self._object_id

    @property
    def object(self):
        return self._object

    @property
    def color(self):
        return self._color

    @property
    def description(self):
        return self._description

    def __str__(self):
        info = {
            'start': self.start,
            'end': self.end,
            'action_id': self.action_id,
            'action': self.action['name'],
            'object_id': self.object_id,
            'object': self.object['name'],
            'description': self.description
        }
        return f"Action: {info}"


class _AnnotationsBase:
    """
    base class for annotation collection / list
    """

    def __init__(self, raw_annotations, video, config, cap):
        self.__raw_annotations = raw_annotations
        self._video = video
        self._config = config
        self._cap = cap
        self._frame2annotation_list = {}
        self._frame_list = []
        self._annotation_list = []

    def _get_annotation_list(self, frame_eq, frame_start, frame_end):
        """
        get annotation list with specified frame range
        :param frame_eq:
        :param frame_start:
        :param frame_end:
        :return: result annotation list
        """
        annotation_list = []
        if frame_eq is not None and (frame_start is not None or frame_end is not None):
            raise LookupError("Cannot query with both 'frame_eq' and one of ['frame_start', 'frame_end']")
        elif frame_eq is not None:
            annotation_list = self._frame2annotation_list[frame_eq]
        elif frame_start is not None and frame_end is not None:
            for frame in self.frame_list:
                if frame_start <= frame <= frame_end:
                    annotation_list.extend(self._frame2annotation_list[frame])
        elif frame_start is not None:
            for frame in self.frame_list:
                if frame_start <= frame:
                    annotation_list.extend(self._frame2annotation_list[frame])
        elif frame_end is not None:
            for frame in self.frame_list:
                if frame <= frame_end:
                    annotation_list.extend(self._frame2annotation_list[frame])
        else:
            annotation_list = self._annotation_list
        return annotation_list

    def query(self):
        """
        interface for querying annotations
        :return: a new _AnnotationsBase object contains results
        """
        raise NotImplemented

    @property
    def frame_list(self):
        return self._frame_list

    @property
    def annotation_list(self):
        return self._annotation_list

    def __len__(self):
        return len(self._annotation_list)

    def __str__(self):
        raise NotImplemented

    def __iter__(self):
        return iter(self._annotation_list)

    def __getitem__(self, index):
        return self._annotation_list[index]


class _ObjectAnnotations(_AnnotationsBase):
    def __init__(self, raw_annotations, video, config, cap):
        super().__init__(raw_annotations, video, config, cap)
        for frame, raw_annotation_list in raw_annotations.items():
            if raw_annotation_list:
                annotation_list = []
                for raw_annotation in raw_annotation_list:
                    annotation_list.append(_ObjectAnnotation(int(frame), raw_annotation, video, config, cap))
                self._frame2annotation_list[frame] = annotation_list
                self._frame_list.append(frame)
                self._annotation_list.extend(annotation_list)

    def query(
            self,
            frame_eq=None,
            frame_start=None,
            frame_end=None,
            instance=None,
            score_min=None,
            score_max=None,
            label_id=None,
            color=None,
            x_min=None,
            x_max=None,
            y_min=None,
            y_max=None,
            width_min=None,
            width_max=None,
            height_min=None,
            height_max=None,
    ):
        annotation_list = self._get_annotation_list(frame_eq, frame_start, frame_end)
        result = {}
        for annotation in annotation_list:
            if (instance is None or annotation.instance == instance) and (
                    score_min is None or (annotation.score is not None and annotation.score >= score_min)) and (
                    score_max is None or (annotation.score is not None and annotation.score <= score_max)) and (
                    label_id is None or annotation.label_id == label_id) and (
                    color is None or color in annotation.color) and (
                    x_min is None or annotation.x >= x_min) and (
                    x_max is None or annotation.x <= x_max) and (
                    y_min is None or annotation.y >= y_min) and (
                    y_max is None or annotation.y <= y_max) and (
                    width_min is None or annotation.width >= width_min) and (
                    width_max is None or annotation.width <= width_max) and (
                    height_min is None or annotation.height >= height_min) and (
                    height_max is None or annotation.height <= height_max
            ):
                if annotation.frame in result:
                    result[annotation.frame].append(annotation.raw_annotation)
                else:
                    result[annotation.frame] = [annotation.raw_annotation]
        return _ObjectAnnotations(result, self._video, self._config, self._cap)

    def __str__(self):
        newline = '\n'
        return f"Objects({len(self._annotation_list)}):\n{newline.join([str(annotation) for annotation in self._annotation_list])}"


class _RegionAnnotations(_AnnotationsBase):
    def __init__(self, raw_annotations, video, config, cap):
        super().__init__(raw_annotations, video, config, cap)
        for frame, raw_annotation_list in raw_annotations.items():
            if raw_annotation_list:
                annotation_list = []
                for raw_annotation in raw_annotation_list:
                    annotation_list.append(_RegionAnnotation(int(frame), raw_annotation, video, config, cap))
                self._frame2annotation_list[frame] = annotation_list
                self._frame_list.append(frame)
                self._annotation_list.extend(annotation_list)

    def query(
            self,
            frame_eq=None,
            frame_start=None,
            frame_end=None,
            instance=None,
            score_min=None,
            score_max=None,
            label_id=None,
            color=None,
            n_point_min=None,
            n_point_max=None,
    ):
        annotation_list = self._get_annotation_list(frame_eq, frame_start, frame_end)
        result = {}
        for annotation in annotation_list:
            if (instance is None or annotation.instance == instance) and (
                    score_min is None or (annotation.score is not None and annotation.score >= score_min)) and (
                    score_max is None or (annotation.score is not None and annotation.score <= score_max)) and (
                    label_id is None or annotation.label_id == label_id) and (
                    color is None or color in annotation.color) and (
                    n_point_min is None or annotation.n_point >= n_point_min) and (
                    n_point_max is None or annotation.n_point <= n_point_max
            ):
                if annotation.frame in result:
                    result[annotation.frame].append(annotation.raw_annotation)
                else:
                    result[annotation.frame] = [annotation.raw_annotation]
        return _RegionAnnotations(result, self._video, self._config, self._cap)

    def __str__(self):
        newline = '\n'
        return f"Regions({len(self._annotation_list)}):\n{newline.join([str(annotation) for annotation in self._annotation_list])}"


class _SkeletonAnnotations(_AnnotationsBase):
    def __init__(self, raw_annotations, video, config, cap):
        super().__init__(raw_annotations, video, config, cap)
        for frame, raw_annotation_list in raw_annotations.items():
            if raw_annotation_list:
                annotation_list = []
                for raw_annotation in raw_annotation_list:
                    annotation_list.append(_SkeletonAnnotation(int(frame), raw_annotation, video, config, cap))
                self._frame2annotation_list[frame] = annotation_list
                self._frame_list.append(frame)
                self._annotation_list.extend(annotation_list)

    def query(
            self,
            frame_eq=None,
            frame_start=None,
            frame_end=None,
            instance=None,
            score_min=None,
            score_max=None,
            type_id=None,
            color=None,
            center_x_min=None,
            center_x_max=None,
            center_y_min=None,
            center_y_max=None,
    ):
        annotation_list = self._get_annotation_list(frame_eq, frame_start, frame_end)
        result = {}
        for annotation in annotation_list:
            if (instance is None or annotation.instance == instance) and (
                    score_min is None or (annotation.score is not None and annotation.score >= score_min)) and (
                    score_max is None or (annotation.score is not None and annotation.score <= score_max)) and (
                    type_id is None or annotation.type_id == type_id) and (
                    color is None or color in annotation.color) and (
                    center_x_min is None or annotation.center_x >= center_x_min) and (
                    center_x_max is None or annotation.center_x <= center_x_max) and (
                    center_y_min is None or annotation.center_y >= center_y_min) and (
                    center_y_max is None or annotation.center_y <= center_y_max
            ):
                if annotation.frame in result:
                    result[annotation.frame].append(annotation.raw_annotation)
                else:
                    result[annotation.frame] = [annotation.raw_annotation]
        return _SkeletonAnnotations(result, self._video, self._config, self._cap)

    def __str__(self):
        newline = '\n'
        return f"Skeletons({len(self._annotation_list)}):\n{newline.join([str(annotation) for annotation in self._annotation_list])}"


class _ActionAnnotations:
    """
    class for action annotation list
    """

    def __init__(self, raw_annotations, video, config, cap):
        self.__raw_annotations = raw_annotations
        self.__video = video
        self.__config = config
        self.__cap = cap
        self._action_annotation_list = []
        for action_annotation in self.__raw_annotations:
            self._action_annotation_list.append(_ActionAnnotation(action_annotation, self.__video, self.__config, cap))

    def query(self, start=None, end=None, action_id=None, object_id=None, color=None, description=None):
        """

        :param start:
        :param end:
        :param action_id:
        :param object_id:
        :param color:
        :param description:
        :return: a new _ActionAnnotations object contains results
        """
        result = []
        for action_annotation in self._action_annotation_list:
            if (start is None or action_annotation.start >= start) and (
                    end is None or action_annotation.end <= end) and (
                    action_id is None or action_annotation.action_id == action_id) and (
                    object_id is None or action_annotation.object_id == object_id) and (
                    color is None or color in action_annotation.color) and (
                    description is None or description in action_annotation.description
            ):
                result.append(action_annotation.raw_annotation)
        return _ActionAnnotations(result, self.__video, self.__config, self.__cap)

    @property
    def action_annotation_list(self):
        return self._action_annotation_list

    def __len__(self):
        return len(self._action_annotation_list)

    def __str__(self):
        newline = '\n'
        return f"Actions({len(self._action_annotation_list)}):\n{newline.join([str(action) for action in self._action_annotation_list])}"

    def __iter__(self):
        return iter(self._action_annotation_list)

    def __getitem__(self, index):
        return self._action_annotation_list[index]


class _Annotation:
    """
    annotation of annotation file
    """

    def __init__(self, raw_annotation, config, cap):
        self.__raw_annotation = raw_annotation

        self.__raw_video = raw_annotation["video"]
        self._video = _Video(self.__raw_video)

        self._keyframe_list = raw_annotation["keyframeList"]

        self.__raw_object_annotation_list_map = raw_annotation["objectAnnotationListMap"]
        self._objects = _ObjectAnnotations(self.__raw_object_annotation_list_map, self._video, config, cap)

        self.__raw_region_annotation_list_map = raw_annotation["regionAnnotationListMap"]
        self._regions = _RegionAnnotations(self.__raw_region_annotation_list_map, self._video, config, cap)

        self.__raw_skeleton_annotation_list_map = raw_annotation["skeletonAnnotationListMap"]
        self._skeletons = _SkeletonAnnotations(self.__raw_skeleton_annotation_list_map, self._video, config, cap)

        self.__raw_action_annotation_list = raw_annotation["actionAnnotationList"]
        self._actions = _ActionAnnotations(self.__raw_action_annotation_list, self._video, config, cap)

    @property
    def video(self):
        return self._video

    @property
    def keyframe_list(self):
        return self._keyframe_list

    @property
    def objects(self):
        return self._objects

    @property
    def regions(self):
        return self._regions

    @property
    def skeletons(self):
        return self._skeletons

    @property
    def actions(self):
        return self._actions

    def __str__(self):
        return str(self.__raw_annotation)


class _Config:
    """
    config of annotation file
    """

    def __init__(self, raw_config):
        self.__raw_config = raw_config

        self._object_label = raw_config["objectLabelData"]
        self._action_label = raw_config["actionLabelData"]
        self._skeleton_type = raw_config["skeletonTypeData"]

    @property
    def object_label(self):
        return self._object_label

    @property
    def action_label(self):
        return self._action_label

    @property
    def skeleton_type(self):
        return self._skeleton_type

    def get_object_label_by_id(self, idx):
        for item in self._object_label:
            if item['id'] == idx:
                return item

    def get_action_label_by_id(self, idx):
        for item in self._action_label:
            if item['id'] == idx:
                return item

    def get_skeleton_type_by_id(self, idx):
        for item in self._skeleton_type:
            if item['id'] == idx:
                return item

    def __str__(self):
        return str(self.__raw_config)


class Vidat:
    """
    main class for annotation file
    """

    def __init__(self, config_pathname, video_pathname=None):
        with open(config_pathname, "r", encoding="utf-8") as f:
            self.__raw_json = f.read()
        self.__raw_data = json.loads(self.__raw_json)

        self._cap = None
        if video_pathname:
            self._cap = cv2.VideoCapture(video_pathname)

        self._version = self.__raw_data["version"]

        self.__raw_config = self.__raw_data["config"]
        self._config = _Config(self.__raw_config)

        self.__raw_annotation = self.__raw_data["annotation"]
        self._annotation = _Annotation(self.__raw_annotation, self._config, self._cap)

    @property
    def version(self):
        return self._version

    @property
    def config(self):
        return self._config

    @property
    def annotation(self):
        return self._annotation

    def __str__(self):
        return str(self.__raw_data)

    def __del__(self):
        self._cap.release()
        cv2.destroyAllWindows()
