#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the eslint command.
 * @author Nicholas C. Zakas
 */

/* eslint no-console:off -- CLI */
import { initializeConfig } from "../lib/init/config-initializer.js";
initializeConfig();
