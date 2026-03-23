import fs from "fs";
import path from "path";

export default async function (context) {
  const localeDir = path.join(context.appOutDir, "locales");

  const keep = [
    "en-US.pak",
    "id.pak",
    "es.pak",
    "pt-PT.pak",
    "ru.pak"
  ];

  fs.readdirSync(localeDir).forEach(file => {
    if (!keep.includes(file)) {
      fs.unlinkSync(path.join(localeDir, file));
    }
  });

  console.log("Locales cleaned 😹");
}