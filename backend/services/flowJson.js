/**
 * Builds the Endpoint-mode Flow JSON for the Vanigan welcome flow.
 *
 * Screens
 *  ─ SERVICE_SELECT     banner + radio (Business / Organizer / Member / Add Business / My Business)
 *  ─ SELECT_DISTRICT    dropdown of 38 TN districts (used by all three list kinds)
 *  ─ SELECT_ASSEMBLY    dropdown of assemblies filtered by chosen district
 *  ─ ITEM_LIST          radio list of businesses / organizers / members
 *                       filtered by kind + district + assembly
 *  ─ MY_BUSINESS_LIST   radio list of the user's own registered businesses
 *  ─ ITEM_DETAILS       image + name + description + recent reviews → "Add Review"
 *  ─ REVIEW             rating (1-5) + free-text review
 *  ─ INFO               terminal "thank you" screen
 *
 * State across screens is passed in the on-click-action payload — the
 * backend re-emits everything needed for the next screen as `data.*`.
 */

function buildFlowJSON() {
  return {
    version: '7.0',
    data_api_version: '3.0',
    routing_model: {
      SERVICE_SELECT: ['SELECT_DISTRICT', 'MY_BUSINESS_LIST', 'ADD_BUSINESS', 'INFO'],
      SELECT_DISTRICT: ['SELECT_ASSEMBLY', 'INFO'],
      SELECT_ASSEMBLY: ['SELECT_CATEGORY', 'ITEM_LIST', 'INFO'],
      SELECT_CATEGORY: ['SELECT_SUBCATEGORY', 'INFO'],
      SELECT_SUBCATEGORY: [],
      ITEM_LIST: ['ITEM_DETAILS', 'INFO'],
      MY_BUSINESS_LIST: ['ITEM_DETAILS', 'INFO'],
      ITEM_DETAILS: ['REVIEW', 'INFO'],
      REVIEW: ['INFO'],
      INFO: [],
    },
    screens: [
      // ─── SERVICE_SELECT ───
      {
        id: 'SERVICE_SELECT',
        title: 'Choose Service',
        data: {
          welcome_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_welcome_banner: { type: 'boolean', __example__: true },
          services: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
              },
            },
            __example__: [
              { id: 'business', title: 'Business List', description: 'Find local businesses' },
              { id: 'subscription', title: 'Subscription', description: 'Upgrade your plan' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.welcome_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Welcome to Vanigan',
              visible: '${data.has_welcome_banner}',
            },
            { type: 'TextBody', text: 'Welcome to Vanigan 🪔\nChoose a service to get started.' },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_service',
              label: 'Select a service',
              required: true,
              'data-source': '${data.services}',
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'data_exchange',
                payload: { selected_service: '${form.selected_service}' },
              },
            },
          ],
        },
      },

      // ─── SELECT_DISTRICT ───
      {
        id: 'SELECT_DISTRICT',
        title: 'Select District',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'Business — Select District' },
          kind: { type: 'string', __example__: 'business' },
          districts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
            },
            __example__: [
              { id: 'Chennai', title: 'Chennai' },
              { id: 'Coimbatore', title: 'Coimbatore' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Select district',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'Dropdown',
              name: 'selected_district',
              label: 'District',
              required: true,
              'data-source': '${data.districts}',
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  kind: '${data.kind}',
                  district: '${form.selected_district}',
                },
              },
            },
          ],
        },
      },

      // ─── SELECT_ASSEMBLY ───
      {
        id: 'SELECT_ASSEMBLY',
        title: 'Select Assembly',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'Chennai — Select Assembly' },
          kind: { type: 'string', __example__: 'business' },
          district: { type: 'string', __example__: 'Chennai' },
          assemblies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
            },
            __example__: [
              { id: 'Mylapore', title: 'Mylapore' },
              { id: 'Velachery', title: 'Velachery' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Select assembly',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'Dropdown',
              name: 'selected_assembly',
              label: 'Assembly Constituency',
              required: true,
              'data-source': '${data.assemblies}',
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  kind: '${data.kind}',
                  district: '${data.district}',
                  assembly: '${form.selected_assembly}',
                },
              },
            },
          ],
        },
      },

      // ─── SELECT_CATEGORY ───
      {
        id: 'SELECT_CATEGORY',
        title: 'Select Category',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'Select Category' },
          kind: { type: 'string', __example__: 'business' },
          district: { type: 'string', __example__: 'Chennai' },
          assembly: { type: 'string', __example__: 'Mylapore' },
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:    { type: 'string' },
                title: { type: 'string' },
                image: { type: 'string' },
              },
            },
            __example__: [
              { id: 'Hospitals & Clinics', title: 'Hospitals & Clinics', image: '' },
              { id: 'Transport', title: 'Transport', image: '' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Select category',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_category',
              label: 'Choose a Category',
              required: true,
              'data-source': '${data.categories}',
            },
            {
              type: 'Footer',
              label: 'Next ›',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  kind: '${data.kind}',
                  district: '${data.district}',
                  assembly: '${data.assembly}',
                  selected_category: '${form.selected_category}',
                },
              },
            },
          ],
        },
      },

      // ─── SELECT_SUBCATEGORY ───
      {
        id: 'SELECT_SUBCATEGORY',
        title: 'Select Sub-Category',
        terminal: true,
        success: true,
        data: {
          screen_banner:     { type: 'string',  __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading:    { type: 'string',  __example__: 'Hospitals & Clinics — Sub-Category' },
          kind:              { type: 'string',  __example__: 'business' },
          district:          { type: 'string',  __example__: 'Chennai' },
          assembly:          { type: 'string',  __example__: 'Mylapore' },
          category:          { type: 'string',  __example__: 'Hospitals & Clinics' },
          subcategories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:    { type: 'string' },
                title: { type: 'string' },
              },
            },
            __example__: [
              { id: 'All', title: '\uD83D\uDD0D All Sub-Categories' },
              { id: 'Dental Clinics', title: 'Dental Clinics' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Sub-category',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'Dropdown',
              name: 'selected_subcategory',
              label: 'Sub-Category',
              required: true,
              'data-source': '${data.subcategories}',
            },
            {
              type: 'Footer',
              label: '\uD83C\uDFEA View Businesses',
              'on-click-action': {
                name: 'complete',
                payload: {
                  kind:                  '${data.kind}',
                  district:              '${data.district}',
                  assembly:              '${data.assembly}',
                  selected_category:     '${data.category}',
                  selected_subcategory:  '${form.selected_subcategory}',
                },
              },
            },
          ],
        },
      },

      // ─── ADD_BUSINESS ───
      {
        id: 'ADD_BUSINESS',
        title: 'Register Business',
        terminal: true,
        success: true,
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Add Business',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '\uD83C\uDFEA Register Your Business' },
            {
              type: 'TextBody',
              text: 'Tap the button below to receive your registration link on WhatsApp. Fill in your business details to get listed on Vanigan!',
            },
            {
              type: 'Footer',
              label: 'Get Registration Link',
              'on-click-action': {
                name: 'complete',
                payload: {},
              },
            },
          ],
        },
      },

      // ─── ITEM_LIST ───
      {
        id: 'ITEM_LIST',
        title: 'Results',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'Businesses in Mylapore' },
          kind: { type: 'string', __example__: 'business' },
          district: { type: 'string', __example__: 'Chennai' },
          assembly: { type: 'string', __example__: 'Mylapore' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
              },
            },
            __example__: [
              { id: 'b1', title: 'Sample Business', description: 'Best in town' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Results',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_item',
              label: 'Pick one',
              required: true,
              'data-source': '${data.items}',
            },
            {
              type: 'Footer',
              label: 'View Details',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  kind: '${data.kind}',
                  district: '${data.district}',
                  assembly: '${data.assembly}',
                  selected_item: '${form.selected_item}',
                },
              },
            },
          ],
        },
      },

      // ─── ITEM_DETAILS ───
      {
        id: 'ITEM_DETAILS',
        title: 'Details',
        data: {
          item_image: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_item_image: { type: 'boolean', __example__: false },
          item_title: { type: 'string', __example__: 'Sample Business' },
          item_subtitle: { type: 'string', __example__: 'Mylapore, Chennai' },
          item_description: { type: 'string', __example__: 'A short description.' },
          item_meta: { type: 'string', __example__: '★ 4.5 (12 reviews)' },
          recent_reviews: { type: 'string', __example__: '★★★★★ — Great service' },
          kind: { type: 'string', __example__: 'business' },
          item_id: { type: 'string', __example__: 'abc123' },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.item_image}',
              width: 1000,
              height: 400,
              'scale-type': 'cover',
              'alt-text': 'Item image',
              visible: '${data.has_item_image}',
            },
            { type: 'TextHeading', text: '${data.item_title}' },
            { type: 'TextCaption', text: '${data.item_subtitle}' },
            { type: 'TextBody', text: '${data.item_description}' },
            { type: 'TextSubheading', text: '${data.item_meta}' },
            { type: 'TextBody', text: '${data.recent_reviews}' },
            {
              type: 'Footer',
              label: 'Add Review',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  action: 'open_review',
                  kind: '${data.kind}',
                  item_id: '${data.item_id}',
                },
              },
            },
          ],
        },
      },

      // ─── REVIEW ───
      {
        id: 'REVIEW',
        title: 'Add Review',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'Rate Sample Business' },
          kind: { type: 'string', __example__: 'business' },
          item_id: { type: 'string', __example__: 'abc123' },
          init_name: { type: 'string', __example__: '' },
          rating_options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
              },
            },
            __example__: [
              { id: '5', title: '★★★★★ Excellent' },
              { id: '4', title: '★★★★ Very Good' },
              { id: '3', title: '★★★ Good' },
              { id: '2', title: '★★ Fair' },
              { id: '1', title: '★ Poor' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Review',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'TextInput',
              name: 'reviewer_name',
              label: 'Your Name',
              required: true,
              'input-type': 'text',
              'init-value': '${data.init_name}',
            },
            {
              type: 'Dropdown',
              name: 'rating',
              label: 'Rating',
              required: true,
              'data-source': '${data.rating_options}',
            },
            {
              type: 'TextArea',
              name: 'review_text',
              label: 'Your Review',
              required: true,
              'helper-text': 'Share your experience with this listing.',
            },
            {
              type: 'Footer',
              label: 'Submit Review',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  action: 'submit_review',
                  kind: '${data.kind}',
                  item_id: '${data.item_id}',
                  reviewer_name: '${form.reviewer_name}',
                  rating: '${form.rating}',
                  review_text: '${form.review_text}',
                },
              },
            },
          ],
        },
      },

      // ─── MY_BUSINESS_LIST ───
      {
        id: 'MY_BUSINESS_LIST',
        title: 'My Businesses',
        data: {
          screen_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_screen_banner: { type: 'boolean', __example__: false },
          screen_heading: { type: 'string', __example__: 'My Businesses' },
          kind: { type: 'string', __example__: 'business' },
          district: { type: 'string', __example__: '' },
          assembly: { type: 'string', __example__: '' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
              },
            },
            __example__: [
              { id: 'b1', title: 'My Store', description: 'Grocery' },
            ],
          },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.screen_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'My Businesses',
              visible: '${data.has_screen_banner}',
            },
            { type: 'TextHeading', text: '${data.screen_heading}' },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_item',
              label: 'Select a business',
              required: true,
              'data-source': '${data.items}',
            },
            {
              type: 'Footer',
              label: 'View Details',
              'on-click-action': {
                name: 'data_exchange',
                payload: {
                  kind: '${data.kind}',
                  district: '${data.district}',
                  assembly: '${data.assembly}',
                  selected_item: '${form.selected_item}',
                },
              },
            },
          ],
        },
      },

      // ─── INFO (terminal) ───
      {
        id: 'INFO',
        title: 'Thank you',
        terminal: true,
        success: true,
        data: {
          info_title: { type: 'string', __example__: 'Thank you' },
          info_body: { type: 'string', __example__: 'We will get back to you soon.' },
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: '${data.info_title}' },
            { type: 'TextBody', text: '${data.info_body}' },
            {
              type: 'Footer',
              label: 'Close',
              'on-click-action': {
                name: 'complete',
                payload: {},
              },
            },
          ],
        },
      },
    ],
  };
}

module.exports = { buildFlowJSON };
