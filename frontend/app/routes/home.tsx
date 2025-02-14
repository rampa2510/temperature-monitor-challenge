import type { Route } from "./+types/home";
import TemperatureMonitor from "~/TemperatureMonitor";

console.log(import.meta.env)

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <TemperatureMonitor />;
}
