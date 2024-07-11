
# VSCode Updater

A Deno-based utility to automatically update Visual Studio Code.

## Features

- Checks for the latest VSCode version.
- Downloads and installs updates automatically.
- Notifies the user about update status.
- Configurable update intervals.

## Prerequisites

- [Deno](https://deno.land/) installed on your system.
- GitHub token (if you want to avoid rate limiting).

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/mnlaugh/vscode-updater.git
   cd vscode-updater
   ```

2. **Create a configuration file**:

   Create a file named `vscu.json` in the root directory with the following content:

   ```json
   {
     "dir": "Your install directory",
     "interval": 1800000,
     "token": "your_github_token"
   }
   ```

   - `dir`: The installation directory of VSCode.
   - `interval`: The update check interval in milliseconds (e.g., `1800000` for 30 minutes).
   - `token`: Your GitHub token to avoid rate limiting (optional).

3. **Run the linter and formatter**:

   Ensure the code is properly formatted and free of linting issues:

   ```bash
   deno task check
   deno task fmt
   ```

## Usage

1. **Start the updater**:

   To run the updater and check for updates:

   ```bash
   deno task start
   ```

2. **Compile the updater**:

   To compile the updater into an executable:

   ```bash
   deno task compile
   ```

## Configuration

The configuration file `vscu.json` must be present in the root directory. Here is an example of the `vscu.json`:

```json
{
  "dir": "E:\\VSCode\\App\\VSCode",
  "interval": 1800000
}
```

- `dir`: Specifies the directory where VSCode is installed.
- `interval`: Specifies the interval in milliseconds for checking updates.
- `token`: (Optional) Your GitHub token to avoid rate limiting.

## Project Structure

- `config.ts`: Handles configuration reading and validation.
- `utils.ts`: Contains utility functions for notifications, logging, and file operations.
- `updater.ts`: Contains the logic for checking and applying updates.
- `vscode-updater.ts`: Main script to run the updater.

## Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -am 'Add new feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Create a new Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the [Deno](https://deno.land/) community for their support and contributions.
- Inspired by the need for automated updates in developer tools.

## Contact

For any issues or inquiries, please open an issue on this repository or contact me at [contact@mnlaugh.com](mailto:contact@mnlaugh.com).

---

© 2024 | VSCode Updater | Made with ❤️ by [mnlaugh](https://nicolas-metivier.fr)
