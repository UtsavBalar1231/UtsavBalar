export type SkillLevel = "proficient" | "semi-proficient" | "familiar";

export interface Skill {
  name: string;
  level: SkillLevel;
}

export const skills: readonly Skill[] = [
  // Proficient
  { name: "C", level: "proficient" },
  { name: "Rust", level: "proficient" },
  { name: "Bash", level: "proficient" },
  { name: "AWK", level: "proficient" },
  { name: "Python", level: "proficient" },
  { name: "Embedded Linux", level: "proficient" },
  { name: "Linux Kernel Dev", level: "proficient" },
  { name: "BSP Engineering", level: "proficient" },
  { name: "Device Drivers", level: "proficient" },
  { name: "Git", level: "proficient" },
  { name: "AOSP", level: "proficient" },
  { name: "Custom ROM Development", level: "proficient" },

  // Semi-Proficient
  { name: "Yocto/Buildroot Project", level: "semi-proficient" },
  { name: "Git Actions", level: "semi-proficient" },
  { name: "U-Boot", level: "semi-proficient" },
  { name: "Apt/Rpm/Arch Package Management", level: "semi-proficient" },
  { name: "ARM Architecture", level: "semi-proficient" },

  // Familiar
  { name: "C++", level: "familiar" },
  { name: "Modern Web Stack", level: "familiar" },
  { name: "MongoDB", level: "familiar" },
  { name: "Figma", level: "familiar" },
  { name: "Qt QML", level: "familiar" },
  { name: "MicroPython", level: "familiar" },
] as const;

export const tools: readonly string[] = [
  "GCC/Clang Cross-Compiler",
  "GDB",
  "QEMU",
  "Docker",
  "Travis CI",
  "Drone CI",
  "Jenkins",
] as const;
