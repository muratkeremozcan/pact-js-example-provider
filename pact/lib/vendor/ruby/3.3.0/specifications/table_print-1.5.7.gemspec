# -*- encoding: utf-8 -*-
# stub: table_print 1.5.7 ruby lib

Gem::Specification.new do |s|
  s.name = "table_print".freeze
  s.version = "1.5.7".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Chris Doyle".freeze]
  s.date = "2020-06-20"
  s.description = "TablePrint turns objects into nicely formatted columns for easy reading. Works great in rails console, works on pure ruby objects, autodetects columns, lets you traverse ActiveRecord associations. Simple, powerful.".freeze
  s.email = "chris@arches.io".freeze
  s.homepage = "http://tableprintgem.com".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.0.3".freeze
  s.summary = "Turn objects into nicely formatted columns for easy reading".freeze

  s.installed_by_version = "3.5.11".freeze if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_development_dependency(%q<cat>.freeze, ["~> 0.2.1".freeze])
  s.add_development_dependency(%q<cucumber>.freeze, ["~> 2.4.0".freeze])
  s.add_development_dependency(%q<rspec>.freeze, ["~> 2.11.0".freeze])
  s.add_development_dependency(%q<rake>.freeze, ["~> 0.9.2".freeze])
end
