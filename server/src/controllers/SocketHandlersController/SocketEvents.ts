export enum SocketEvents {
    NewLocation = 'new-location',
    NewUser = 'new-user',
    UserDisconnected = 'user-disconnected',
    PreviousAroundUsers = 'previous-around-users',
    RequestShareLocation = 'request-share-location',
    ReceiveShareLocationRequest = 'receive-share-location-request',
    AcceptShareLocationRequest = 'accept-share-location-request',
    StartShareLocation = 'start-share-location',
    RejectShareLocationRequest = 'reject-share-location-request',
    ShareLocationRequestWasRejected = 'share-location-request-was-rejected',
    NewLocationWhileSharing = 'new-location-while-sharing',
    StopLocationSharing = 'stop-location-sharing',
    ShareLocationHasStopped = 'share-location-has-stopped',
}

export enum RequestShareLocationStatus {
    Requested = 'requested',
    AlreadySharing = 'already-sharing',
    UserBusy = 'user-busy',
}
