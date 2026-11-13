# Ghost supplemental material

## Running Ghost on the examples

This assumes you have Docker installed. First, run whichever of the following two commands is appropriate for your machine:

```sh
docker load --input ghost-docker-x86_64-linux.tar
```

```sh
docker load --input ghost-docker-aarch64-linux.tar
```

Once the Docker image is loaded, the following loop runs it over all the included example proofs:

```sh
(
  for proof in proofs/*.txt; do
    printf '\n%s\n' "$proof"
    status=0
    docker run --rm -i --pull=never \
      --network=none --read-only --cap-drop=ALL --security-opt=no-new-privileges \
      ghost-checker:artifact < "$proof" || status=$?
    printf 'Exit status: %s\n' "$status"
    case "$status" in
      0|1|2) ;;
      *) exit "$status" ;;
    esac
  done
)
```

## Building Ghost from source

This assumes you have Nix installed on Linux. To check Ghost's Rocq code for errors:

```sh
nix flake check
```

Or to build the Docker image:

```sh
nix build
```
