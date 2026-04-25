import type { ChecklistTemplate, Verdict } from '@vo360/shared';

const ALL: Verdict[] = ['majorly_comply', 'partial_comply', 'not_complied', 'na'];

/**
 * Retail Inline Inspection — apparel/garment AQL inspection performed at the
 * factory line during production (between sewing and packing). Modeled on
 * standard buyer protocols (AQL 2.5 major / 4.0 minor) used by Indian
 * apparel exporters.
 */
export const retailInline: ChecklistTemplate = {
  id: '33333333-3333-3333-3333-333333333333',
  name: 'Retail Inline Inspection',
  industry: 'retail',
  version: 1,
  isActive: true,
  sections: [
    {
      id: '33333333-3333-3333-3333-3333cccc0001',
      name: 'Pre-Production Setup',
      order: 1,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1001',
          text: 'Is the buyer-approved sample available at the production line for reference?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1002',
          text: 'Are trims and accessories matching the bulk approval sheet (color, size, brand)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1003',
          text: 'Is the line layout consistent with the approved process flow?',
          isMandatory: false,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1004',
          text: 'Have operators been briefed on the critical defect list for this style?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-3333cccc0002',
      name: 'Workmanship - Visual',
      order: 2,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1005',
          text: 'Are stitching defects (skip stitch, broken stitch, loose thread) within AQL 2.5?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1006',
          text: 'Are seam puckering and uneven seams absent on inspected pieces?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1007',
          text: 'Is color shading within the approved range across cut, sewn and finished pieces?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1008',
          text: 'Are print, embroidery and applique placements per the approved spec?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1009',
          text: 'Are stains, holes, and fabric defects absent on inspected pieces?',
          isMandatory: true,
          responseOptions: ALL,
          order: 5,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-3333cccc0003',
      name: 'Measurements',
      order: 3,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1010',
          text: 'Do garment measurements fall within the approved tolerance (±0.5 inch typical)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1011',
          text: 'Are critical points of measure (chest, length, sleeve) checked per AQL plan?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1012',
          text: 'Is the measurement record signed by both QC and floor supervisor?',
          isMandatory: false,
          responseOptions: ALL,
          order: 3,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-3333cccc0004',
      name: 'Trims & Labels',
      order: 4,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1013',
          text: 'Is the main label correctly attached and oriented per the spec sheet?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1014',
          text: 'Are care label and country-of-origin label present, legible and durable?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1015',
          text: 'Are size labels correctly sequenced when packed in cartons (assortment correct)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1016',
          text: 'Are buttons, zippers and snaps functional on tested samples (pull/peel test)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-3333cccc0005',
      name: 'Packing & Cartons',
      order: 5,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1017',
          text: 'Is poly bag size, barcode and warning text correct per buyer requirement?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1018',
          text: 'Are folding and presentation per the buyer-approved presentation board?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1019',
          text: 'Are carton markings (PO, style, color, qty, dimensions) accurate and legible?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1020',
          text: 'Has carton drop test been performed and passed for sample cartons?',
          isMandatory: false,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-3333cccc0006',
      name: 'Compliance & Documentation',
      order: 6,
      questions: [
        {
          id: '33333333-3333-3333-3333-3333cccc1021',
          text: 'Is the inline inspection report being filled in real-time on the line?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1022',
          text: 'Are needle policy and metal detection logs maintained and signed?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '33333333-3333-3333-3333-3333cccc1023',
          text: 'Are reject and rework counts being tracked against shift production?',
          isMandatory: false,
          responseOptions: ALL,
          order: 3,
        },
      ],
    },
  ],
};
