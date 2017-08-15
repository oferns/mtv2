import { trigger, state, animate, transition, style } from '@angular/animations';

export const FadeIn =
    // trigger name for attaching this animation to an element using the [@triggerName] syntax
    trigger('fadeIn', [

        // route 'enter' transition
        transition(':enter', [

            // css styles at start of transition
            style({ opacity: 0 }),

            // animation and styles at end of transition
            animate('.3s', style({ opacity: 1 }))
        ]),
    ]);