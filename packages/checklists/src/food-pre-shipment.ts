import type { ChecklistTemplate, Verdict } from '@vo360/shared';

const ALL: Verdict[] = ['majorly_comply', 'partial_comply', 'not_complied', 'na'];

/**
 * Food Pre-Shipment Audit — performed at processing facility before goods leave.
 * Modeled on FSSAI / GMP / HACCP-style pre-dispatch checks used in Indian
 * food manufacturing (dairy, packaged foods, frozen, ready-to-eat).
 */
export const foodPreShipment: ChecklistTemplate = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'Food Pre-Shipment Audit',
  industry: 'food',
  version: 1,
  isActive: true,
  sections: [
    {
      id: '11111111-1111-1111-1111-1111aaaa0001',
      name: 'Documentation & Records',
      order: 1,
      questions: [
        {
          id: '11111111-1111-1111-1111-1111aaaa1001',
          text: 'Are batch production records complete and signed by the supervisor?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1002',
          text: 'Are HACCP records (CCPs, temperature logs) current and reviewed for the last 7 days?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1003',
          text: 'Are GMP and food-safety training records up to date for all production staff?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1004',
          text: 'Are pest control reports from a licensed pest control vendor available?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1005',
          text: 'Are calibration certificates available for thermometers and weighing scales?',
          isMandatory: false,
          responseOptions: ALL,
          order: 5,
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-1111aaaa0002',
      name: 'Personnel & Hygiene',
      order: 2,
      questions: [
        {
          id: '11111111-1111-1111-1111-1111aaaa1006',
          text: 'Are all personnel wearing required PPE — hairnets, gloves, aprons, beard covers?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1007',
          text: 'Is the handwashing facility functional with soap, sanitizer and disposable towels?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1008',
          text: 'Are health declaration / fitness records current for all staff in production zones?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1009',
          text: 'Is restricted access enforced for non-production personnel entering processing area?',
          isMandatory: false,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-1111aaaa0003',
      name: 'Facility & Equipment',
      order: 3,
      questions: [
        {
          id: '11111111-1111-1111-1111-1111aaaa1010',
          text: 'Are processing surfaces visibly clean and sanitized per the cleaning schedule?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1011',
          text: 'Is fire safety equipment (extinguishers, alarms) accessible and within inspection date?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1012',
          text: 'Are pest entry points (doors, windows, drains) sealed and fly catchers operational?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1013',
          text: 'Is lighting adequate at processing stations and free from broken or unshielded bulbs?',
          isMandatory: false,
          responseOptions: ALL,
          order: 4,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1014',
          text: 'Is the metal detector functional and tested with standard test pieces this shift?',
          isMandatory: true,
          responseOptions: ALL,
          order: 5,
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-1111aaaa0004',
      name: 'Product Quality',
      order: 4,
      questions: [
        {
          id: '11111111-1111-1111-1111-1111aaaa1015',
          text: 'Does product weight meet specification within ±2% tolerance on sampled units?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1016',
          text: 'Are labels accurate including allergen declarations, ingredients and FSSAI license number?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1017',
          text: 'Are MFG and best-before dates correctly printed and legible on packaging?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1018',
          text: 'Is packaging integrity intact for sample units (no leaks, tears, swelling)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-1111aaaa0005',
      name: 'Storage & Dispatch',
      order: 5,
      questions: [
        {
          id: '11111111-1111-1111-1111-1111aaaa1019',
          text: 'Is cold chain maintained — chilled below 4°C, frozen below -18°C — at storage and loading bay?',
          isMandatory: true,
          responseOptions: ALL,
          order: 1,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1020',
          text: 'Is FIFO / FEFO followed in dispatch staging with clear date marking?',
          isMandatory: true,
          responseOptions: ALL,
          order: 2,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1021',
          text: 'Are dispatch vehicles inspected for cleanliness and pre-cooled before loading?',
          isMandatory: true,
          responseOptions: ALL,
          order: 3,
        },
        {
          id: '11111111-1111-1111-1111-1111aaaa1022',
          text: 'Does shipment documentation match the purchase order (SKU, qty, batch numbers)?',
          isMandatory: true,
          responseOptions: ALL,
          order: 4,
        },
      ],
    },
  ],
};
