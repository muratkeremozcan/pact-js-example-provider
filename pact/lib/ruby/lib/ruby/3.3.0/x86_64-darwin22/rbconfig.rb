# encoding: ascii-8bit
# frozen-string-literal: false
#
# The module storing Ruby interpreter configurations on building.
#
# This file was created by mkconfig.rb when ruby was built.  It contains
# build information for ruby which is used e.g. by mkmf to build
# compatible native extensions.  Any changes made to this file will be
# lost the next time ruby is built.

module RbConfig
  RUBY_VERSION.start_with?("3.3.") or
    raise "ruby lib version (3.3.3) doesn't match executable version (#{RUBY_VERSION})"

  # Ruby installed directory.
  TOPDIR = File.dirname(__FILE__).chomp!("/lib/ruby/3.3.0/x86_64-darwin22")
  # DESTDIR on make install.
  DESTDIR = '' unless defined? DESTDIR
  # The hash configurations stored.
  CONFIG = {}
  CONFIG["DESTDIR"] = DESTDIR
  CONFIG["MAJOR"] = "3"
  CONFIG["MINOR"] = "3"
  CONFIG["TEENY"] = "3"
  CONFIG["PATCHLEVEL"] = "89"
  CONFIG["INSTALL"] = '/usr/bin/install -c'
  CONFIG["EXEEXT"] = ""
  CONFIG["prefix"] = (TOPDIR || DESTDIR + "/tmp/ruby-3.3.3-x86_64/inst")
  CONFIG["ruby_install_name"] = "$(RUBY_BASE_NAME)"
  CONFIG["RUBY_INSTALL_NAME"] = "$(RUBY_BASE_NAME)"
  CONFIG["RUBY_SO_NAME"] = "$(RUBY_BASE_NAME).$(RUBY_API_VERSION)"
  CONFIG["exec"] = "exec"
  CONFIG["ruby_pc"] = "ruby-3.3.pc"
  CONFIG["CC_WRAPPER"] = ""
  CONFIG["PACKAGE"] = "ruby"
  CONFIG["BUILTIN_TRANSSRCS"] = " enc/trans/newline.c"
  CONFIG["MKMF_VERBOSE"] = "0"
  CONFIG["MANTYPE"] = "doc"
  CONFIG["vendorarchhdrdir"] = "$(vendorhdrdir)/$(sitearch)"
  CONFIG["sitearchhdrdir"] = "$(sitehdrdir)/$(sitearch)"
  CONFIG["rubyarchhdrdir"] = "$(rubyhdrdir)/$(arch)"
  CONFIG["vendorhdrdir"] = "$(rubyhdrdir)/vendor_ruby"
  CONFIG["sitehdrdir"] = "$(rubyhdrdir)/site_ruby"
  CONFIG["rubyhdrdir"] = "$(includedir)/$(RUBY_VERSION_NAME)"
  CONFIG["RUBY_SEARCH_PATH"] = ""
  CONFIG["UNIVERSAL_INTS"] = ""
  CONFIG["UNIVERSAL_ARCHNAMES"] = ""
  CONFIG["configure_args"] = " '--prefix' '/tmp/ruby-3.3.3-x86_64/inst' '--without-ext=tk,sdbm,gdbm,dbm,dl,coverage' '--disable-install-doc' '--with-openssl-dir=/private/var/folders/4_/xyjwmyz1497g3qhhndg003800000gn/T/cirrus-ci-build/osx/runtime' '--build=x86_64-apple-darwin22' 'build_alias=x86_64-apple-darwin22' 'CC=/private/var/folders/4_/xyjwmyz1497g3qhhndg003800000gn/T/cirrus-ci-build/osx/internal/bin/cc' 'CXX=/private/var/folders/4_/xyjwmyz1497g3qhhndg003800000gn/T/cirrus-ci-build/osx/internal/bin/c++' 'CFLAGS=-Wno-error=incompatible-function-pointer-types -Wno-int-conversion' 'CPPFLAGS=-Wno-error=incompatible-function-pointer-types -Wno-int-conversion' 'CXXFLAGS=-Wno-error=incompatible-function-pointer-types -Wno-int-conversion'"
  CONFIG["CONFIGURE"] = "configure"
  CONFIG["vendorarchdir"] = "$(vendorlibdir)/$(sitearch)"
  CONFIG["vendorlibdir"] = "$(vendordir)/$(ruby_version)"
  CONFIG["vendordir"] = "$(rubylibprefix)/vendor_ruby"
  CONFIG["sitearchdir"] = "$(sitelibdir)/$(sitearch)"
  CONFIG["sitelibdir"] = "$(sitedir)/$(ruby_version)"
  CONFIG["sitedir"] = "$(rubylibprefix)/site_ruby"
  CONFIG["rubyarchdir"] = "$(rubylibdir)/$(arch)"
  CONFIG["rubylibdir"] = "$(rubylibprefix)/$(ruby_version)"
  CONFIG["ruby_version"] = "3.3.0"
  CONFIG["sitearch"] = "$(arch)"
  CONFIG["arch"] = "x86_64-darwin22"
  CONFIG["sitearchincludedir"] = "$(includedir)/$(sitearch)"
  CONFIG["archincludedir"] = "$(includedir)/$(arch)"
  CONFIG["sitearchlibdir"] = "$(libdir)/$(sitearch)"
  CONFIG["archlibdir"] = "$(libdir)/$(arch)"
  CONFIG["libdirname"] = "libdir"
  CONFIG["RUBY_EXEC_PREFIX"] = "/tmp/ruby-3.3.3-x86_64/inst"
  CONFIG["RUBY_LIB_VERSION"] = ""
  CONFIG["RUBY_LIB_VERSION_STYLE"] = "3\t/* full */"
  CONFIG["RI_BASE_NAME"] = "ri"
  CONFIG["ridir"] = "$(datarootdir)/$(RI_BASE_NAME)"
  CONFIG["rubysitearchprefix"] = "$(rubylibprefix)/$(sitearch)"
  CONFIG["rubyarchprefix"] = "$(rubylibprefix)/$(arch)"
  CONFIG["MAKEFILES"] = "Makefile GNUmakefile"
  CONFIG["USE_LLVM_WINDRES"] = ""
  CONFIG["PLATFORM_DIR"] = ""
  CONFIG["COROUTINE_TYPE"] = "amd64"
  CONFIG["THREAD_MODEL"] = "pthread"
  CONFIG["SYMBOL_PREFIX"] = "_"
  CONFIG["EXPORT_PREFIX"] = ""
  CONFIG["COMMON_HEADERS"] = ""
  CONFIG["COMMON_MACROS"] = ""
  CONFIG["COMMON_LIBS"] = ""
  CONFIG["MAINLIBS"] = "-lgmp -ldl -lobjc -lpthread "
  CONFIG["ENABLE_SHARED"] = "no"
  CONFIG["DLDSHARED"] = "$(CC) -dynamiclib"
  CONFIG["DLDLIBS"] = ""
  CONFIG["SOLIBS"] = "$(MAINLIBS)"
  CONFIG["LIBRUBYARG_SHARED"] = ""
  CONFIG["LIBRUBYARG_STATIC"] = "-l$(RUBY_SO_NAME)-static -framework CoreFoundation $(MAINLIBS)"
  CONFIG["LIBRUBYARG"] = "$(LIBRUBYARG_STATIC)"
  CONFIG["LIBRUBY"] = "$(LIBRUBY_A)"
  CONFIG["LIBRUBY_ALIASES"] = "lib$(RUBY_SO_NAME).$(SOEXT)"
  CONFIG["LIBRUBY_SONAME"] = "lib$(RUBY_SO_NAME).$(SOEXT).$(RUBY_API_VERSION)"
  CONFIG["LIBRUBY_SO"] = "lib$(RUBY_SO_NAME).$(SOEXT).$(RUBY_PROGRAM_VERSION)"
  CONFIG["LIBRUBY_A"] = "lib$(RUBY_SO_NAME)-static.a"
  CONFIG["RUBYW_INSTALL_NAME"] = ""
  CONFIG["rubyw_install_name"] = ""
  CONFIG["EXTDLDFLAGS"] = "-bundle_loader '$(BUILTRUBY)'"
  CONFIG["EXTLDFLAGS"] = ""
  CONFIG["strict_warnflags"] = ""
  CONFIG["warnflags"] = "-Wall -Wextra -Wextra-tokens -Wdeprecated-declarations -Wdivision-by-zero -Wdiv-by-zero -Wimplicit-function-declaration -Wimplicit-int -Wpointer-arith -Wshorten-64-to-32 -Wwrite-strings -Wold-style-definition -Wmissing-noreturn -Wno-cast-function-type -Wno-constant-logical-operand -Wno-long-long -Wno-missing-field-initializers -Wno-overlength-strings -Wno-parentheses-equality -Wno-self-assign -Wno-tautological-compare -Wno-unused-parameter -Wno-unused-value -Wunused-variable -Wmisleading-indentation -Wundef"
  CONFIG["debugflags"] = "-ggdb3"
  CONFIG["optflags"] = "-O3 -fno-fast-math"
  CONFIG["NULLCMD"] = ":"
  CONFIG["ENABLE_DEBUG_ENV"] = ""
  CONFIG["DLNOBJ"] = "dln.o"
  CONFIG["RJIT_SUPPORT"] = "yes"
  CONFIG["YJIT_OBJ"] = ""
  CONFIG["YJIT_LIBS"] = ""
  CONFIG["CARGO_BUILD_ARGS"] = ""
  CONFIG["YJIT_SUPPORT"] = "no"
  CONFIG["CARGO"] = ""
  CONFIG["RUSTC"] = "no"
  CONFIG["INSTALL_STATIC_LIBRARY"] = "yes"
  CONFIG["EXECUTABLE_EXTS"] = ""
  CONFIG["ARCHFILE"] = ""
  CONFIG["LIBRUBY_RELATIVE"] = "no"
  CONFIG["EXTOUT"] = ".ext"
  CONFIG["PREP"] = "miniruby$(EXEEXT)"
  CONFIG["CROSS_COMPILING"] = "no"
  CONFIG["TEST_RUNNABLE"] = "yes"
  CONFIG["rubylibprefix"] = "$(libdir)/$(RUBY_BASE_NAME)"
  CONFIG["setup"] = "Setup"
  CONFIG["SOEXT"] = "dylib"
  CONFIG["TRY_LINK"] = ""
  CONFIG["PRELOADENV"] = "DYLD_INSERT_LIBRARIES"
  CONFIG["LIBPATHENV"] = "DYLD_LIBRARY_PATH"
  CONFIG["RPATHFLAG"] = ""
  CONFIG["LIBPATHFLAG"] = " -L%s"
  CONFIG["LINK_SO"] = "\n$(POSTLINK)"
  CONFIG["ADDITIONAL_DLDFLAGS"] = ""
  CONFIG["ENCSTATIC"] = ""
  CONFIG["EXTSTATIC"] = ""
  CONFIG["ASMEXT"] = "S"
  CONFIG["LIBEXT"] = "a"
  CONFIG["DLEXT"] = "bundle"
  CONFIG["LDSHAREDXX"] = "$(CXX) -dynamic -bundle"
  CONFIG["LDSHARED"] = "$(CC) -dynamic -bundle"
  CONFIG["CCDLFLAGS"] = "-fno-common"
  CONFIG["STATIC"] = ""
  CONFIG["ARCH_FLAG"] = ""
  CONFIG["DLDFLAGS"] = "-Wl,-undefined,dynamic_lookup"
  CONFIG["ALLOCA"] = ""
  CONFIG["EGREP"] = "/usr/bin/grep -E"
  CONFIG["GREP"] = "/usr/bin/grep"
  CONFIG["dsymutil"] = "dsymutil"
  CONFIG["codesign"] = "codesign"
  CONFIG["cleanlibs"] = "$(TARGET_SO).dSYM"
  CONFIG["POSTLINK"] = "dsymutil $@ 2>/dev/null; { test -z '$(RUBY_CODESIGN)' || codesign -s '$(RUBY_CODESIGN)' -f $@; }"
  CONFIG["incflags"] = ""
  CONFIG["WERRORFLAG"] = "-Werror"
  CONFIG["RUBY_DEVEL"] = ""
  CONFIG["CHDIR"] = "cd -P"
  CONFIG["RMALL"] = "rm -fr"
  CONFIG["RMDIRS"] = "rmdir -p"
  CONFIG["RMDIR"] = "rmdir"
  CONFIG["CP"] = "cp"
  CONFIG["RM"] = "rm -f"
  CONFIG["PKG_CONFIG"] = "pkg-config"
  CONFIG["DOXYGEN"] = ""
  CONFIG["DOT"] = ""
  CONFIG["MKDIR_P"] = "mkdir -p"
  CONFIG["INSTALL_DATA"] = "$(INSTALL) -m 644"
  CONFIG["INSTALL_SCRIPT"] = "$(INSTALL)"
  CONFIG["INSTALL_PROGRAM"] = "$(INSTALL)"
  CONFIG["SET_MAKE"] = ""
  CONFIG["LN_S"] = "ln -s"
  CONFIG["DLLWRAP"] = ""
  CONFIG["WINDRES"] = ""
  CONFIG["ASFLAGS"] = ""
  CONFIG["ARFLAGS"] = "rcu "
  CONFIG["try_header"] = ""
  CONFIG["CC_VERSION_MESSAGE"] = "Apple clang version 15.0.0 (clang-1500.3.9.4)\nTarget: x86_64-apple-darwin23.5.0\nThread model: posix\nInstalledDir: /Library/Developer/CommandLineTools/usr/bin"
  CONFIG["CC_VERSION"] = "$(CC) --version"
  CONFIG["CSRCFLAG"] = ""
  CONFIG["COUTFLAG"] = "-o "
  CONFIG["OUTFLAG"] = "-o "
  CONFIG["CPPOUTFILE"] = "-o conftest.i"
  CONFIG["GNU_LD"] = "no"
  CONFIG["GCC"] = "yes"
  CONFIG["CPP"] = "$(CC) -E"
  CONFIG["CXXFLAGS"] = "-Wno-error=incompatible-function-pointer-types -Wno-int-conversion -fdeclspec"
  CONFIG["OBJEXT"] = "o"
  CONFIG["CPPFLAGS"] = "-Wno-error=incompatible-function-pointer-types -Wno-int-conversion -D_XOPEN_SOURCE -D_DARWIN_C_SOURCE -D_DARWIN_UNLIMITED_SELECT -D_REENTRANT $(DEFS) $(cppflags)"
  CONFIG["LDFLAGS"] = "-L. -fstack-protector-strong"
  CONFIG["CFLAGS"] = "-Wno-error=incompatible-function-pointer-types -Wno-int-conversion $(cflags) -pipe"
  CONFIG["STRIP"] = "strip -A -n"
  CONFIG["RANLIB"] = "ranlib"
  CONFIG["OBJDUMP"] = "objdump"
  CONFIG["OBJCOPY"] = ":"
  CONFIG["NM"] = "nm --no-llvm-bc"
  CONFIG["LD"] = "ld"
  CONFIG["CXX"] = "/private/var/folders/4_/xyjwmyz1497g3qhhndg003800000gn/T/cirrus-ci-build/osx/internal/bin/c++"
  CONFIG["AS"] = "as"
  CONFIG["AR"] = "ar"
  CONFIG["CC"] = "/private/var/folders/4_/xyjwmyz1497g3qhhndg003800000gn/T/cirrus-ci-build/osx/internal/bin/cc"
  CONFIG["wasmoptflags"] = ""
  CONFIG["WASMOPT"] = ""
  CONFIG["target_os"] = "darwin22"
  CONFIG["target_vendor"] = "apple"
  CONFIG["target_cpu"] = "x86_64"
  CONFIG["target"] = "$(target_cpu)-$(target_vendor)-$(target_os)"
  CONFIG["host_os"] = "$(target_os)"
  CONFIG["host_vendor"] = "$(target_vendor)"
  CONFIG["host_cpu"] = "$(target_cpu)"
  CONFIG["host"] = "$(target)"
  CONFIG["build_os"] = "darwin22"
  CONFIG["build_vendor"] = "apple"
  CONFIG["build_cpu"] = "x86_64"
  CONFIG["build"] = "x86_64-apple-darwin22"
  CONFIG["RUBY_VERSION_NAME"] = "$(RUBY_BASE_NAME)-$(ruby_version)"
  CONFIG["RUBYW_BASE_NAME"] = "rubyw"
  CONFIG["RUBY_BASE_NAME"] = "ruby"
  CONFIG["RUBY_PROGRAM_VERSION"] = "$(MAJOR).$(MINOR).$(TEENY)"
  CONFIG["RUBY_API_VERSION"] = "$(MAJOR).$(MINOR)"
  CONFIG["HAVE_GIT"] = "yes"
  CONFIG["GIT"] = "git"
  CONFIG["cxxflags"] = ""
  CONFIG["cppflags"] = ""
  CONFIG["cflags"] = "-fdeclspec $(optflags) $(debugflags) $(warnflags)"
  CONFIG["MAKEDIRS"] = "mkdir -p"
  CONFIG["target_alias"] = ""
  CONFIG["host_alias"] = "$(target_alias)"
  CONFIG["build_alias"] = "x86_64-apple-darwin22"
  CONFIG["LIBS"] = "-lpthread "
  CONFIG["ECHO_T"] = ""
  CONFIG["ECHO_N"] = ""
  CONFIG["ECHO_C"] = "\\\\c"
  CONFIG["DEFS"] = ""
  CONFIG["mandir"] = "$(datarootdir)/man"
  CONFIG["localedir"] = "$(datarootdir)/locale"
  CONFIG["libdir"] = "$(exec_prefix)/lib"
  CONFIG["psdir"] = "$(docdir)"
  CONFIG["pdfdir"] = "$(docdir)"
  CONFIG["dvidir"] = "$(docdir)"
  CONFIG["htmldir"] = "$(docdir)"
  CONFIG["infodir"] = "$(datarootdir)/info"
  CONFIG["docdir"] = "$(datarootdir)/doc/$(PACKAGE)"
  CONFIG["oldincludedir"] = "/usr/include"
  CONFIG["includedir"] = "$(SDKROOT)""$(prefix)/include"
  CONFIG["runstatedir"] = "$(localstatedir)/run"
  CONFIG["localstatedir"] = "$(prefix)/var"
  CONFIG["sharedstatedir"] = "$(prefix)/com"
  CONFIG["sysconfdir"] = "$(prefix)/etc"
  CONFIG["datadir"] = "$(datarootdir)"
  CONFIG["datarootdir"] = "$(prefix)/share"
  CONFIG["libexecdir"] = "$(exec_prefix)/libexec"
  CONFIG["sbindir"] = "$(exec_prefix)/sbin"
  CONFIG["bindir"] = "$(exec_prefix)/bin"
  CONFIG["exec_prefix"] = "$(prefix)"
  CONFIG["PACKAGE_URL"] = ""
  CONFIG["PACKAGE_BUGREPORT"] = ""
  CONFIG["PACKAGE_STRING"] = ""
  CONFIG["PACKAGE_VERSION"] = ""
  CONFIG["PACKAGE_TARNAME"] = ""
  CONFIG["PACKAGE_NAME"] = ""
  CONFIG["PATH_SEPARATOR"] = ":"
  CONFIG["SHELL"] = "/bin/sh"
  CONFIG["UNICODE_VERSION"] = "15.0.0"
  CONFIG["UNICODE_EMOJI_VERSION"] = "15.0"
  CONFIG["SDKROOT"] = ""
  CONFIG["platform"] = "$(arch)"
  CONFIG["archdir"] = "$(rubyarchdir)"
  CONFIG["topdir"] = File.dirname(__FILE__)
  # Almost same with CONFIG. MAKEFILE_CONFIG has other variable
  # reference like below.
  #
  #   MAKEFILE_CONFIG["bindir"] = "$(exec_prefix)/bin"
  #
  # The values of this constant is used for creating Makefile.
  #
  #   require 'rbconfig'
  #
  #   print <<-END_OF_MAKEFILE
  #   prefix = #{RbConfig::MAKEFILE_CONFIG['prefix']}
  #   exec_prefix = #{RbConfig::MAKEFILE_CONFIG['exec_prefix']}
  #   bindir = #{RbConfig::MAKEFILE_CONFIG['bindir']}
  #   END_OF_MAKEFILE
  #
  #   => prefix = /usr/local
  #      exec_prefix = $(prefix)
  #      bindir = $(exec_prefix)/bin  MAKEFILE_CONFIG = {}
  #
  # RbConfig.expand is used for resolving references like above in rbconfig.
  #
  #   require 'rbconfig'
  #   p RbConfig.expand(RbConfig::MAKEFILE_CONFIG["bindir"])
  #   # => "/usr/local/bin"
  MAKEFILE_CONFIG = {}
  CONFIG.each{|k,v| MAKEFILE_CONFIG[k] = v.dup}

  # call-seq:
  #
  #   RbConfig.expand(val)         -> string
  #   RbConfig.expand(val, config) -> string
  #
  # expands variable with given +val+ value.
  #
  #   RbConfig.expand("$(bindir)") # => /home/foobar/all-ruby/ruby19x/bin
  def RbConfig::expand(val, config = CONFIG)
    newval = val.gsub(/\$\$|\$\(([^()]+)\)|\$\{([^{}]+)\}/) {
      var = $&
      if !(v = $1 || $2)
	'$'
      elsif key = config[v = v[/\A[^:]+(?=(?::(.*?)=(.*))?\z)/]]
	pat, sub = $1, $2
	config[v] = false
	config[v] = RbConfig::expand(key, config)
	key = key.gsub(/#{Regexp.quote(pat)}(?=\s|\z)/n) {sub} if pat
	key
      else
	var
      end
    }
    val.replace(newval) unless newval == val
    val
  end
  CONFIG.each_value do |val|
    RbConfig::expand(val)
  end

  # call-seq:
  #
  #   RbConfig.fire_update!(key, val)               -> array
  #   RbConfig.fire_update!(key, val, mkconf, conf) -> array
  #
  # updates +key+ in +mkconf+ with +val+, and all values depending on
  # the +key+ in +mkconf+.
  #
  #   RbConfig::MAKEFILE_CONFIG.values_at("CC", "LDSHARED") # => ["gcc", "$(CC) -shared"]
  #   RbConfig::CONFIG.values_at("CC", "LDSHARED")          # => ["gcc", "gcc -shared"]
  #   RbConfig.fire_update!("CC", "gcc-8")                  # => ["CC", "LDSHARED"]
  #   RbConfig::MAKEFILE_CONFIG.values_at("CC", "LDSHARED") # => ["gcc-8", "$(CC) -shared"]
  #   RbConfig::CONFIG.values_at("CC", "LDSHARED")          # => ["gcc-8", "gcc-8 -shared"]
  #
  # returns updated keys list, or +nil+ if nothing changed.
  def RbConfig.fire_update!(key, val, mkconf = MAKEFILE_CONFIG, conf = CONFIG) # :nodoc:
    return if mkconf[key] == val
    mkconf[key] = val
    keys = [key]
    deps = []
    begin
      re = Regexp.new("\\$\\((?:%1$s)\\)|\\$\\{(?:%1$s)\\}" % keys.join('|'))
      deps |= keys
      keys.clear
      mkconf.each {|k,v| keys << k if re =~ v}
    end until keys.empty?
    deps.each {|k| conf[k] = mkconf[k].dup}
    deps.each {|k| expand(conf[k])}
    deps
  end

  # call-seq:
  #
  #   RbConfig.ruby -> path
  #
  # returns the absolute pathname of the ruby command.
  def RbConfig.ruby
    File.join(
      RbConfig::CONFIG["bindir"],
      RbConfig::CONFIG["ruby_install_name"] + RbConfig::CONFIG["EXEEXT"]
    )
  end
end
CROSS_COMPILING = nil unless defined? CROSS_COMPILING

# Traveling Ruby modifications:
# get rid of our custom compilation flags.
[RbConfig::CONFIG, RbConfig::MAKEFILE_CONFIG].each do |config|
  config["CC"] = (String.new << "xcrun clang")
  config["CXX"] = (String.new << "xcrun clang++")
  config["CPP"] = (String.new << "xcrun clang -E")
  config["LDSHARED"] = (String.new << "xcrun clang -dynamic -bundle")
  config["LDSHAREDXX"] = (String.new << "xcrun clang++ -dynamic -bundle")
  config["CFLAGS"] = config["cflags"].dup
  config["CXXFLAGS"] = config["cxxflags"].dup
  config["RUBY_EXEC_PREFIX"] = config["exec_prefix"].dup
  config.delete("CC_VERSION")
end
