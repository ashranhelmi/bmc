<?php

return [

    /*
    |--------------------------------------------------------------------------
    | BMC Sections
    |--------------------------------------------------------------------------
    |
    | Fixed Osterwalder Business Model Canvas sections — no product requirement
    | for facilitator customization, so these live here rather than in a DB
    | table (cheap to promote later if that ever changes).
    |
    | Colors are the dataviz skill's validated 8-hue categorical palette
    | (references/palette.md), assigned in a fixed order — NOT re-derived or
    | cycled. Identity here never relies on color alone: each section always
    | shows its label as a heading regardless of color, which is also what
    | satisfies the "relief" requirement for the 3 slots (aqua, yellow,
    | magenta) that the validator flags below 3:1 contrast on a light surface.
    |
    | Only 8 validated hues exist for a 9th section (Cost Structure) — rather
    | than stretch to an unvalidated 9th competing hue, Cost Structure gets a
    | deliberately neutral/muted treatment instead. This also matches the
    | classic BMC layout convention of grouping Cost Structure + Revenue
    | Streams as the "financial" row, visually distinct from the 7 operational
    | blocks above them.
    |
    */

    'sections' => [
        'key_partners' => [
            'label' => 'Key Partners',
            'color' => '#4a3aa7', // violet
            'question' => 'Who are our key partners/suppliers, and what do we get from them?',
        ],
        'key_activities' => [
            'label' => 'Key Activities',
            'color' => '#2a78d6', // blue
            'question' => 'What key activities does our value proposition require?',
        ],
        'key_resources' => [
            'label' => 'Key Resources',
            'color' => '#1baf7a', // aqua
            'question' => 'What key resources does our value proposition require?',
        ],
        'value_propositions' => [
            'label' => 'Value Propositions',
            'color' => '#eb6834', // orange — the hero block
            'question' => 'What value do we deliver? Which problems are we helping solve?',
        ],
        'customer_relationships' => [
            'label' => 'Customer Relationships',
            'color' => '#e87ba4', // magenta
            'question' => 'What relationship does each segment expect us to maintain?',
        ],
        'channels' => [
            'label' => 'Channels',
            'color' => '#eda100', // yellow
            'question' => 'How do we reach our customer segments?',
        ],
        'customer_segments' => [
            'label' => 'Customer Segments',
            'color' => '#008300', // green
            'question' => 'Who are we creating value for? Who are our most important customers?',
        ],
        'revenue_streams' => [
            'label' => 'Revenue Streams',
            'color' => '#e34948', // red — last of the 8 validated hues
            'question' => 'For what value are customers currently willing to pay?',
        ],
        'cost_structure' => [
            'label' => 'Cost Structure',
            'color' => '#6b6a65', // deliberately neutral — see note above, not a 9th competing hue
            'question' => 'What are the most important costs in our business model?',
        ],
    ],

    // The free-form area is not a BMC section — no guiding question, no fixed
    // hue, styled as a distinct open canvas rather than a "10th section".
    'freeform_key' => 'freeform',

    /*
    |--------------------------------------------------------------------------
    | Participant Cursor Colors
    |--------------------------------------------------------------------------
    |
    | A separate concern from section colors above — this is what a
    | participant picks for their own cursor/notes. Reuses the same validated
    | 8-hue set (already vetted for CVD separation) rather than inventing a
    | second, unvalidated palette. Server-arbitrated uniqueness (see
    | ParticipantController) means at most 8 participants can be simultaneously
    | connected with distinct colors — acceptable for an in-person workshop's
    | realistic headcount.
    |
    */

    'participant_colors' => [
        '#2a78d6', // blue
        '#eb6834', // orange
        '#1baf7a', // aqua
        '#eda100', // yellow
        '#e87ba4', // magenta
        '#008300', // green
        '#4a3aa7', // violet
        '#e34948', // red
    ],

];
