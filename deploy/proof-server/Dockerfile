# Run this as a persistent web service with HTTPS provided by the host.
# Keep the image version aligned with the dApp's ledger-v8 dependency.
FROM midnightntwrk/proof-server:8.1.0

ENV MIDNIGHT_PROOF_SERVER_PORT=6300
EXPOSE 6300

# Exec form also works with the upstream distroless image (no shell required).
CMD ["midnight-proof-server"]
