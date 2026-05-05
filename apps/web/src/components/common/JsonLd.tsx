type JsonLdNode = Record<string, unknown> | Record<string, unknown>[];

interface JsonLdProps {
  data: JsonLdNode;
}

export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
  />
);
