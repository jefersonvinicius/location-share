export type Coords = {
    latitude: number;
    longitude: number;
};

export function isInnerRadius(center?: Coords, other?: Coords, radiusInKm = 5): boolean {
    if (!center || !other) return false;
    return calculate(other) <= radiusInKm;

    function calculate(coords: Coords) {
        const { latitude, longitude } = coords;
        center = center as Coords;

        const factor = 0.0175;
        const sin = Math.sin(latitude * factor) * Math.sin(center.latitude * factor);
        const cos =
            Math.cos(latitude * factor) *
            Math.cos(center.latitude * factor) *
            Math.cos(center.longitude * factor - longitude * factor);
        const acos = Math.acos(sin + cos);
        return acos * 6371;
    }
}
