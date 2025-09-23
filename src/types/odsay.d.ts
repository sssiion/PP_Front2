export interface OdsayRoute {
    pathInfo: PathInfo;
    geometry: Geometry;
}

export interface PathInfo {
    info: {
        totalTime: number;
        mapObj?: string;
        // ... add other info properties if needed
    };
    subPath: SubPath[];
}

export interface SubPath {
    trafficType: 1 | 2 | 3; // 1: 지하철, 2: 버스, 3: 도보
    sectionTime: number;
    lane?: {
        name?: string;
        busNo?: string;
    }[];
    startName?: string;
    endName?: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    startID?: number;
    endID?: number;
}

export interface Geometry {
    lane: Lane[];
    boundary: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
}

export interface Lane {
    type: 1 | 2;
    section: {
        graphPos: { x: number; y: number }[];
        startID?: number;
        endID?: number;
    }[];
}
