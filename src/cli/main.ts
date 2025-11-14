#!/usr/bin/env node
import { Command } from "commander";
import { generateTypeFile } from "../generator/typeGen.ts";

const program = new Command();

program
  .name("safe-router")
  .description("Type-safe route generator for React and Next.js projects");

program
  .command("generate")
  .option("-r, --root <path>", "Project root directory", ".")
  .option("-t, --type <type>", "Project type: react | next-app | next-page", "react")
  .option("-o, --out <path>", "Output file path", "./generated/routes.d.ts")
  .option("-m, --mode <mode>", "Type generation mode: flat | hierarchy", "hierarchy")
  .option("-w, --watch", "Watch for directory changes", false)
  .action(async (opts) => {
    await generateTypeFile({
      root: opts.root,
      type: opts.type,
      out: opts.out,
      watch: opts.watch,
    });
  });

program.parse();
