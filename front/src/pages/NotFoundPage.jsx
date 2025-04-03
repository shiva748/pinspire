import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <section className="bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 text-center">
        <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-white">
          404
        </h1>
        <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl text-white">
          Page not found currently
        </p>
        <p className="mb-6 text-lg font-light text-gray-300">
          Sorry, we can't find such page.
        </p>
        <Link
          to={"/"}
          className="text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium rounded-full text-sm px-5 py-2.5 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-900"
        >
          Back To Home
        </Link>
      </div>
    </section>
  );
};

export default NotFoundPage;
