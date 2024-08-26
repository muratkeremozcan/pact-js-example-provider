# -*- encoding: utf-8 -*-
# stub: dig_rb 1.0.1 ruby lib

Gem::Specification.new do |s|
  s.name = "dig_rb".freeze
  s.version = "1.0.1".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.require_paths = ["lib".freeze]
  s.authors = ["Jonathan Rochkind".freeze]
  s.bindir = "exe".freeze
  s.date = "2016-01-21"
  s.email = ["jonathan@dnil.net".freeze]
  s.homepage = "https://github.com/jrochkind/dig_rb".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "2.5.1".freeze
  s.summary = "Array/Hash/Struct#dig backfill for ruby".freeze

  s.installed_by_version = "3.5.11".freeze if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_development_dependency(%q<rake>.freeze, ["~> 10.0".freeze])
  s.add_development_dependency(%q<minitest>.freeze, ["~> 5.8.0".freeze])
end
