import os
import importlib

package_name = __name__

for file in os.listdir(os.path.dirname(__file__)):
    if file.endswith(".py") and file != "__init__.py":
        module_name = f"{package_name}.{file[:-3]}"
        importlib.import_module(module_name)
