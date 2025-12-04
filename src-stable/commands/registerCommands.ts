export function registerAllCommands(plugin:any){
  const Create = require('./CreateZettelCommand').CreateZettelCommand;
  const Nav = require('./NavigateCommand').NavigateCommand;
  const Reorder = require('./ReorderCommand').ReorderCommand;
  const Inspect = require('./InspectCommand').InspectCommand;
  const Box = require('./BoxCommands').BoxCommands;
  Create.CreateZettelCommand.register(plugin);
  Nav.NavigateCommand.register(plugin);
  Reorder.ReorderCommand.register(plugin);
  Inspect.InspectCommand.register(plugin);
  Box.BoxCommands.register(plugin);
}
