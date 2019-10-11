# CHANGELOG

##[0.0.15]
### Added
- 对所有的基本数据类型进行了封装，形成了PerTypes。PerTypes中
  的类型包含了初始化方法，也包含了求和等方法。
- 新增了一个Schema类，用以生成Record，并代替原先Header的功能。

### Removed
- 去掉了Header

### Changed
- 所有的容器类，包括Group, List和Record，修改了constructor，
  使之可以接受一个和自己一样的对象实例，通过Object.assign将传
  入对象的所有属性复制给自己，相当于通过shallow copy创建了一
  个新对象。

- 所有的容器类，包括Group, List和Record，之前都包含一个newRef
  的方法，在更改操作后相当于创建了一个新的对象，现在通过上述的
  新构造方法来返回新的对象。