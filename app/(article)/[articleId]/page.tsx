import { fakerDE as faker } from "@faker-js/faker";
import { Link } from "~/components/Link";

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl grid gap-10 my-8 px-8 lg:my-20 text-lg leading-relaxed isolate">
      <h1 className="text-4xl font-bold">
        {faker.lorem.sentence({ min: 5, max: 15 })}
      </h1>
      {Array.from({ length: 4 }).map((_, index) => (
        <p key={index}>{faker.lorem.paragraph({ min: 10, max: 20 })}</p>
      ))}
      <h2 className="text-2xl font-bold">Related Contents</h2>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="p-8 border rounded grid gap-2 auto-rows-min"
        >
          <Link
            href={`/${faker.lorem.slug({ min: 1, max: 8 })}`}
            className="text-xl font-bold"
          >
            {faker.lorem.sentence({ min: 5, max: 15 })}
          </Link>
          <p className="line-clamp-5 text-sm">
            {faker.lorem.paragraph({ min: 10, max: 20 })}
          </p>
        </div>
      ))}
    </div>
  );
}
