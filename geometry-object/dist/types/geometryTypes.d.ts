export interface BaseGeoObject {
    label: string;
    type: string;
}
export interface ASTPoint extends BaseGeoObject {
}
export interface ASTSegment extends BaseGeoObject {
    p1: ASTPoint;
    p2: ASTPoint;
}
export interface ASTAngle extends BaseGeoObject {
    center: ASTPoint;
    p1: ASTPoint;
    p3: ASTPoint;
    p1Center: ASTSegment;
    p3Center: ASTSegment;
}
export interface ASTTriangle extends BaseGeoObject {
    p1: ASTPoint;
    p2: ASTPoint;
    p3: ASTPoint;
    p1p2: ASTSegment;
    p2p3: ASTSegment;
    p3p1: ASTSegment;
    a1: ASTAngle;
    a2: ASTAngle;
    a3: ASTAngle;
}
//# sourceMappingURL=geometryTypes.d.ts.map