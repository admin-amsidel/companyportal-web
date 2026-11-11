/*
 * Copyright (c) 2026 IANEL Technologies. All rights reserved.
 * Designed and developed by IANEL Technologies.
 */
import type { IconName } from '../pages/landing/icon';

export interface ProductModule {
  icon: IconName;
  /** colour of the icon tile, see .tone--* in landing.scss */
  tone: string;
  title: string;
  short: string;
  text: string;
  points: string[];
}

/** The eight modules: the landing page's strip and cards, and the support chat's "Explore features". */
export const PRODUCT_MODULES: ProductModule[] = [
  {
    icon: 'users', tone: 'blue', title: 'Employee Management', short: 'Employees',
    text: 'One record for every person: profile, documents, bank details, designation and who they report to.',
    points: ['Org chart built from reporting lines', 'PAN, ID and offer-letter documents', 'Roles: owner, admin, manager, employee'],
  },
  {
    icon: 'calendar', tone: 'green', title: 'Attendance & Leave', short: 'Attendance',
    text: 'Check-in with photo and location from any phone, leave requests with approvals, holidays and leave plans.',
    points: ['Selfie + GPS check-in and check-out', 'Leave balances, grants and approvals', 'Office and restricted holidays'],
  },
  {
    icon: 'wallet', tone: 'amber', title: 'Payroll & Payslip', short: 'Payslip',
    text: 'Salary structures from your own pay components, monthly payslips as PDF and income-tax estimates.',
    points: ['Earnings, deductions, reimbursements', 'Payslip PDFs employees can download', 'Travel allowance claims'],
  },
  {
    icon: 'clipboard', tone: 'violet', title: 'Work Log & Productivity', short: 'Work Log',
    text: 'Daily work logs against targets, tasks with due dates, work-hour rules and performance reviews.',
    points: ['Tasks assigned and tracked to done', 'Work-hour rules per brand', 'Review cycles with star ratings'],
  },
  {
    icon: 'box', tone: 'orange', title: 'Product Management', short: 'Products',
    text: 'Items, categories and suppliers, purchases and stock received — with QR labels you can scan.',
    points: ['Purchase bills and stock ledger', 'Printable QR item labels', 'Stock scanning from the phone'],
  },
  {
    icon: 'chart', tone: 'pink', title: 'Sales Management', short: 'Sales',
    text: 'Quotations, invoices and receipts, payments in and out, bank reconciliation and sales reports.',
    points: ['Quotes, invoices and receipts as PDF', 'UPI QR and online payments', 'Bank statement reconciliation'],
  },
  {
    icon: 'userCheck', tone: 'teal', title: 'Customer Management', short: 'Customers',
    text: 'Customers and their projects in one place, with a private link customers use to follow progress.',
    points: ['Project stages and photo updates', 'Customer progress-tracking link', 'Mail customers from the portal'],
  },
  {
    icon: 'briefcase', tone: 'purple', title: 'Agent Management', short: 'Agents',
    text: 'Sales agents and partners with their own profiles, the customers they bring and the commission due.',
    points: ['Agent profiles and photos', 'Commission per sale', 'Who brought which customer'],
  },
];
