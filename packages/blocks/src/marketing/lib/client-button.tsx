'use client';

/**
 * The kit Button as a client module of its own. The kit's Button pulls the icon context in as it
 * loads, which a server component cannot do, so the parts reach it through this boundary: a static
 * block rendered on the server imports the parts without loading the Button at all.
 */
export { Button } from '@rectio/ui';
