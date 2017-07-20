import { } from '@types/bingmaps';

import { IMapOptions } from '../abstractions/imap.options';

declare var Microsoft: any;


export class BingMapOptions implements IMapOptions {

    readonly options: Microsoft.Maps.IMapOptions;
    constructor(...args: any[]) {

        this.options = {

        };
    }

}


// https://msdn.microsoft.com/en-us/library/mt712646.aspx
// Constructor-only arguments
// allowHidingLabelsOfRoad = false
// backgroundColor = #EAE8E1
// credentials
// disableStreetside = false
// disableStreetsideAutoCoverage = false
// enableClickableLogo
// enableInertia
// liteMode
// showDashboard
// showLocateMeButton
// showMapTypeSelector
// showScalebar
// showZoomButtons

// https://developers.google.com/maps/documentation/javascript/reference#MapOptions
// Constructor-only arguments
// backgroundColor
// 
