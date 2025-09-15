// Simple shims for global libraries
import JSZip from 'jszip';
import ePub from 'epubjs';

// Make them available globally for the app
(window as any).JSZip = JSZip;
(window as any).ePub = ePub;

export { JSZip, ePub };