angular.module('Constants').constant('EventsDescription', {
    ALERT_TYPE_AREA: 0x1, // Motion inside inactive area
    ALERT_TYPE_CALIBRATION_ERROR: 0x2, // Camera calibration error
    ALERT_TYPE_INVALID_MOTION: 0x4, // Motion in wrong direction
    ALERT_TYPE_VELOCITY: 0x8, // Too fast or too slow motion
    ALERT_TYPE_STATIC_OBJECT: 0x10,    // Left object
    ALERT_TYPE_PEOPLE_COUNT: 0x20
});
