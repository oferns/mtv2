export interface IMarkerOptions {
    id: number;
    anchor?: any;
    draggable?: boolean;
    title?: string;
    label?: string;
    subTitle?: string;
    cursor?: string;
    icon?: string;
    onClick?(handler: (...args: any[]) => void): void;
    onDragStart?(handler: (...args: any[]) => void): void;
    onDrag?(handler: (...args: any[]) => void): void;
    onDragEnd?(handler: (...args: any[]) => void): void;

}


// Bing = google
// anchor 
// color
// cursor
// draggable
// enableClickedStyle
// enableHoverStyle
// icon
// roundClickableArea
// subTitle
// title
// text
// textOffset
// visible


// google
// anchorPoint
// animation
// clickable
// crossOnDrag
// cursor
// draggable
// icon
// label
// opacity
// optimized
// place <- Leave this out
// shape
// title
// visible
// zIndex
