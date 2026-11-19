#!/usr/bin/env node
import { processContext } from './core/context.ts';
import { main } from './main.ts';

process.exitCode = await main(process.argv.slice(2), processContext(process.cwd()));
