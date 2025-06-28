import os
import shutil

def create_copies(directory):
    """
    Creates 25 copies of every file in the given directory.

    Args:
        directory (str): The path to the directory containing the files to copy.
    """
    print(f"Creating 25 copies of every file in '{directory}'...")

    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a valid directory.")
        return

    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)

        if os.path.isfile(filepath):
            name, ext = os.path.splitext(filename)

            for i in range(25):
                new_filename = f"{name}{i}{ext}"
                new_filepath = os.path.join(directory, new_filename)

                # Avoid overwriting existing files
                if not os.path.exists(new_filepath):
                    shutil.copy(filepath, new_filepath)
                else:
                    print(f"Skipped existing file: {new_filepath}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python create_copies.py <directory-path>")
    else:
        create_copies(sys.argv[1])
