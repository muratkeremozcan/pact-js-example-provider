# -*- encoding: utf-8 -*-
# stub: pact-message 0.11.1 ruby lib

Gem::Specification.new do |s|
  s.name = "pact-message".freeze
  s.version = "0.11.1".freeze

  s.required_rubygems_version = Gem::Requirement.new(">= 0".freeze) if s.respond_to? :required_rubygems_version=
  s.metadata = { "allowed_push_host" => "https://rubygems.org" } if s.respond_to? :metadata=
  s.require_paths = ["lib".freeze]
  s.authors = ["Beth Skurrie".freeze]
  s.date = "2021-04-20"
  s.email = ["beth@bethesque.com".freeze]
  s.executables = ["console".freeze, "pact-message".freeze, "setup".freeze]
  s.files = ["bin/console".freeze, "bin/pact-message".freeze, "bin/setup".freeze]
  s.homepage = "http://pact.io".freeze
  s.licenses = ["MIT".freeze]
  s.rubygems_version = "3.2.16".freeze
  s.summary = "Consumer contract library for messages".freeze

  s.installed_by_version = "3.5.11".freeze if s.respond_to? :installed_by_version

  s.specification_version = 4

  s.add_runtime_dependency(%q<pact-support>.freeze, ["~> 1.8".freeze])
  s.add_runtime_dependency(%q<pact-mock_service>.freeze, ["~> 3.1".freeze])
  s.add_runtime_dependency(%q<thor>.freeze, [">= 0.20".freeze, "< 2.0".freeze])
  s.add_development_dependency(%q<rake>.freeze, ["~> 12.3".freeze, ">= 12.3.3".freeze])
  s.add_development_dependency(%q<rspec>.freeze, ["~> 3.0".freeze])
  s.add_development_dependency(%q<pry-byebug>.freeze, [">= 0".freeze])
  s.add_development_dependency(%q<conventional-changelog>.freeze, ["~> 1.2".freeze])
  s.add_development_dependency(%q<bump>.freeze, ["~> 0.5".freeze])
end
