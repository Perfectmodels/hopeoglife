import type { NextPageContext } from "next";

function Error({ statusCode }: { statusCode?: number }) {
  return (
    <p style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      {statusCode ? `Une erreur ${statusCode} est survenue` : "Une erreur est survenue"}
    </p>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
