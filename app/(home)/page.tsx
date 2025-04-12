import { fakerDE as faker } from "@faker-js/faker";
import { Link } from "~/components/Link";

export default function Page() {
  return (
    <div className="mx-auto max-w-8xl px-4 lg:px-8 md:grid-cols-2 lg:grid-cols-3 grid gap-4 my-4 lg:my-10 text-lg leading-relaxed isolate">
      {Array.from({ length: 21 }).map((_, index) => (
        <div
          key={index}
          className="p-8 border rounded grid gap-4 auto-rows-min"
        >
          <Link href="/article" className="text-2xl font-bold">
            {faker.lorem.sentence({ min: 5, max: 15 })}
          </Link>
          <p className="line-clamp-5">
            {faker.lorem.paragraph({ min: 10, max: 20 })}
          </p>
        </div>
      ))}
    </div>
  );
}
